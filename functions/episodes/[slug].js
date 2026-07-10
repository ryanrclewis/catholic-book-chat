import initialEpisodes from '../../data/episodes.js'

export async function onRequestGet(context) {
  const slug = context.params.slug
  const bucket = context.env.PODCAST_BUCKET
  let episodes = initialEpisodes

  // 1. Try to load dynamic episodes from R2
  if (bucket) {
    try {
      const object = await bucket.get('episodes.json')
      if (object) {
        episodes = await object.json()
      }
    } catch (e) {
      console.error('Failed to load episodes from R2 in fallback handler:', e)
    }
  }

  // 2. Find the requested episode
  const episode = episodes.find(ep => ep.slug === slug)

  // 3. If not found in dynamic episodes, let Pages serve the static assets (e.g. static pages or 404)
  if (!episode) {
    return context.next()
  }

  // 4. If found, serve the SPA shell (index.html) with edge-injected SEO metadata tags!
  try {
    const url = new URL(context.request.url)
    // Fetch the main index.html file from static assets
    const assetResponse = await context.env.ASSETS.fetch(new URL('/', url.origin))
    
    if (!assetResponse.ok) {
      return context.next()
    }

    let html = await assetResponse.text()

    // Inject SEO tags dynamically at the edge
    const titleEscaped = escapeHtml(episode.title)
    const descEscaped = escapeHtml(episode.description)
    const subtitleEscaped = escapeHtml(episode.subtitle)
    
    // Replace title
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${titleEscaped} — Between The Lines</title>`)
    
    // Inject Open Graph and regular meta tags into the <head>
    const metaTags = `
  <title>${titleEscaped} — Between The Lines</title>
  <meta name="description" content="${descEscaped}" />
  <meta property="og:title" content="${titleEscaped} — Between The Lines" />
  <meta property="og:description" content="${descEscaped}" />
  <meta property="og:type" content="music.song" />
  <meta property="og:url" content="${url.href}" />
    `
    
    // Insert right after <head>
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
