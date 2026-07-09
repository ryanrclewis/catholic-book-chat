export async function onRequest(context) {
  const { request, env, params } = context
  
  // Extract file name from the parameter. Pages Functions decodes parameters automatically.
  const key = params.file

  if (!key) {
    return new Response('Resource Not Found', { status: 404 })
  }

  // Allow HEAD and GET requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Fetch object from the bound R2 bucket.
  let object
  try {
    const rangeHeader = request.headers.get('range')
    const options = {
      onlyIf: request.headers,
    }
    
    if (rangeHeader) {
      options.range = rangeHeader
    }

    if (!env.PODCAST_BUCKET) {
      return new Response(
        'R2 Bucket Binding (PODCAST_BUCKET) is missing in Cloudflare Pages settings.',
        { status: 500 }
      )
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
  headers.set('cache-control', 'public, max-age=31536000') // Cache for 1 year
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
}
