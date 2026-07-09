export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    
    // Extract file name from the path. Assuming URL path like /audio/filename.mp3
    // We decode it to handle spaces or special characters correctly.
    const pathParts = url.pathname.split('/')
    const key = decodeURIComponent(pathParts[pathParts.length - 1])

    if (!key || pathParts.length < 2) {
      return new Response('Resource Not Found', { status: 404 })
    }

    // Allow HEAD and GET requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    // Fetch object from R2 bucket
    let object
    try {
      // Support Range requests (essential for iOS and browser audio seeking)
      const rangeHeader = request.headers.get('range')
      
      const options = {
        onlyIf: request.headers,
      }
      
      if (rangeHeader) {
        options.range = rangeHeader
      }

      object = await env.PODCAST_BUCKET.get(key, options)
    } catch (err) {
      return new Response(`Error fetching resource: ${err.message}`, { status: 500 })
    }

    if (object === null) {
      return new Response('Audio File Not Found', { status: 404 })
    }

    // Construct response headers
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    
    // Explicit range request metadata response
    if (object.range) {
      const offset = object.range.offset
      const length = object.range.length
      const end = offset + length - 1
      headers.set('content-range', `bytes ${offset}-${end}/${object.size}`)
      headers.set('content-length', length.toString())
    } else {
      headers.set('content-length', object.size.toString())
    }

    // Standard audio headers
    if (!headers.has('content-type')) {
      headers.set('content-type', 'audio/mpeg')
    }
    
    headers.set('accept-ranges', 'bytes')
    headers.set('cache-control', 'public, max-age=31536000') // Cache for 1 year (audio files are immutable)
    headers.set('access-control-allow-origin', '*')

    // Handle HEAD request
    if (request.method === 'HEAD') {
      return new Response(null, {
        headers,
        status: object.range ? 206 : 200,
      })
    }

    return new Response(object.body, {
      headers,
      status: object.range ? 206 : 200,
    })
  },
}
