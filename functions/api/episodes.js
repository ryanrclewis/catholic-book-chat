import initialEpisodes from '../../data/episodes.js'

// Helper to return CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}

export async function onRequestGet(context) {
  const bucket = context.env.PODCAST_BUCKET
  if (!bucket) {
    return new Response(JSON.stringify({ error: 'R2 bucket PODCAST_BUCKET binding not found' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    const object = await bucket.get('episodes.json')
    if (object) {
      const data = await object.json()
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    // Fallback to static seed data if episodes.json doesn't exist yet in R2
    return new Response(JSON.stringify(initialEpisodes), {
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

  try {
    const episodes = await context.request.json()

    if (!Array.isArray(episodes)) {
      return new Response(JSON.stringify({ error: 'Invalid payload: must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    // Write episodes list back to R2
    await bucket.put('episodes.json', JSON.stringify(episodes, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'no-cache, no-store, must-revalidate',
      }
    })

    return new Response(JSON.stringify({ success: true, message: 'Episodes updated successfully' }), {
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
