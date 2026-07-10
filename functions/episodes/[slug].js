import initialEpisodes from '../../data/episodes.js'

export async function onRequestGet(context) {
  const slug = context.params.slug
  const bucket = context.env.PODCAST_BUCKET
  let episodes = initialEpisodes

  // 1. If this episode is statically pre-rendered at build time (exists in initialEpisodes),
  // let Cloudflare Pages serve the static file directly from the CDN.
  const isStatic = initialEpisodes.some(ep => ep.slug === slug)
  if (isStatic) {
    return context.next()
  }

  // 2. Try to load dynamic episodes from R2
  if (bucket) {
    try {
      const object = await bucket.get('episodes.json')
      if (object) {
        episodes = await object.json()
      }
    } catch (e) {
      console.error('Failed to load episodes from R2 in dynamic router:', e)
    }
  }

  // 3. Find the requested episode
  const episode = episodes.find(ep => ep.slug === slug)

  // 4. If not found in dynamic episodes list, let Pages serve the 404 page
  if (!episode) {
    return context.next()
  }

  // 5. If found, serve the SPA shell (index.html) with edge-injected SEO metadata
  // AND rewrite window.__NEXT_DATA__ so the React router mounts the correct route!
  try {
    const url = new URL(context.request.url)
    const assetResponse = await context.env.ASSETS.fetch(new URL('/', url.origin))
    
    if (!assetResponse.ok) {
      return context.next()
    }

    let html = await assetResponse.text()

    // Extract and rewrite window.__NEXT_DATA__
    const nextDataMatch = html.match(/<script>window\.__NEXT_DATA__\s*=\s*(.*?)</)
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1])
        
        // Update Next.js route variables
        nextData.page = "/episodes/[slug]"
        nextData.query = { slug: episode.slug }
        nextData.props = {
          pageProps: {
            episode: episode
          }
        }
        
        // Replace in HTML
        html = html.replace(
          /<script>window\.__NEXT_DATA__\s*=\s*.*?<\/script>/,
          `<script>window.__NEXT_DATA__ = ${JSON.stringify(nextData)}</script>`
        )
      } catch (err) {
        console.error('Failed to rewrite __NEXT_DATA__ on edge:', err)
      }
    }

    // Inject SEO tags dynamically in the head
    const titleEscaped = escapeHtml(episode.title)
    const descEscaped = escapeHtml(episode.description)
    
    const metaTags = `
  <title>${titleEscaped} — Between The Lines</title>
  <meta name="description" content="${descEscaped}" />
  <meta property="og:title" content="${titleEscaped} — Between The Lines" />
  <meta property="og:description" content="${descEscaped}" />
  <meta property="og:type" content="music.song" />
  <meta property="og:url" content="${url.href}" />
    `
    
    html = html.replace(/<head>/i, `<head>${metaTags}`)

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=600',
      }
    })
  } catch (error) {
    console.error('Error in edge SSR fallback:', error)
    return context.next()
  }
}

// Simple HTML escaping helper
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
