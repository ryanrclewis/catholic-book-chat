// Helper to return CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Filename',
    'Access-Control-Max-Age': '86400',
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}

export async function onRequestPost(context) {
  const bucket = context.env.PODCAST_BUCKET
  if (!bucket) {
    return new Response(JSON.stringify({ error: 'R2 bucket PODCAST_BUCKET binding not found' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  // Validate Authorization
  const authHeader = context.request.headers.get('Authorization')
  const expectedPassword = context.env.ADMIN_PASSWORD

  if (!expectedPassword) {
    return new Response(JSON.stringify({ error: 'ADMIN_PASSWORD environment variable not set on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  if (!authHeader || authHeader !== expectedPassword) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  // Get filename from header
  const filename = context.request.headers.get('X-Filename')
  if (!filename) {
    return new Response(JSON.stringify({ error: 'Missing X-Filename header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  // Ensure it has a safe name and is an mp3
  if (!filename.endsWith('.mp3')) {
    return new Response(JSON.stringify({ error: 'Invalid file format: Only MP3 uploads are allowed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    const contentType = context.request.headers.get('Content-Type') || 'audio/mpeg'
    
    // Stream the request body directly into the R2 bucket
    await bucket.put(filename, context.request.body, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      }
    })

    return new Response(JSON.stringify({ 
      success: true, 
      message: `File ${filename} uploaded successfully to R2`,
      filename 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
