import podcast from '../data/podcast.js'
import initialEpisodes from '../data/episodes.js'

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return ''
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

export async function onRequestGet(context) {
  const bucket = context.env.PODCAST_BUCKET
  let episodes = initialEpisodes

  // Try to load dynamic episodes from R2
  if (bucket) {
    try {
      const object = await bucket.get('episodes.json')
      if (object) {
        episodes = await object.json()
      }
    } catch (e) {
      console.error('Failed to load episodes from R2 for RSS feed:', e)
    }
  }

  const pubDateLatest = episodes.length > 0 
    ? new Date(episodes[0].publishDate).toUTCString()
    : new Date().toUTCString()

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <atom:link href="${escapeXml(podcast.siteUrl + podcast.feedPath)}" rel="self" type="application/rss+xml" />
    <title>${escapeXml(podcast.title)}</title>
    <description>${escapeXml(podcast.description)}</description>
    <link>${escapeXml(podcast.siteUrl)}</link>
    <language>${escapeXml(podcast.language)}</language>
    <copyright>Copyright © ${new Date().getFullYear()} ${escapeXml(podcast.author)}</copyright>
    <lastBuildDate>${pubDateLatest}</lastBuildDate>
    <pubDate>${pubDateLatest}</pubDate>
    
    <itunes:author>${escapeXml(podcast.author)}</itunes:author>
    <itunes:subtitle>${escapeXml(podcast.description)}</itunes:subtitle>
    <itunes:summary>${escapeXml(podcast.description)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    
    <itunes:owner>
      <itunes:name>${escapeXml(podcast.ownerName)}</itunes:name>
      <itunes:email>${escapeXml(podcast.ownerEmail)}</itunes:email>
    </itunes:owner>
    
    <itunes:image href="${escapeXml(podcast.imageUrl)}" />
    
    <itunes:category text="${escapeXml(podcast.category)}">
      ${podcast.subcategory ? `<itunes:category text="${escapeXml(podcast.subcategory)}" />` : ''}
    </itunes:category>
    
    <itunes:explicit>${escapeXml(podcast.explicit)}</itunes:explicit>
`

  // Sort episodes: latest first
  const sortedEpisodes = [...episodes].sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))

  for (const ep of sortedEpisodes) {
    const epPubDate = new Date(ep.publishDate).toUTCString()
    const epUrl = `${podcast.siteUrl}/episodes/${ep.slug}`
    const audioUrl = `${podcast.audioBaseUrl}/${ep.audioFile}`

    xml += `    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${escapeXml(ep.description)}</description>
      <pubDate>${epPubDate}</pubDate>
      <link>${escapeXml(epUrl)}</link>
      <guid isPermaLink="true">${escapeXml(epUrl)}</guid>
      <enclosure url="${escapeXml(audioUrl)}" length="${ep.fileSize}" type="audio/mpeg" />
      
      <itunes:title>${escapeXml(ep.title)}</itunes:title>
      <itunes:subtitle>${escapeXml(ep.subtitle)}</itunes:subtitle>
      <itunes:summary>${escapeXml(ep.description)}</itunes:summary>
      <itunes:duration>${escapeXml(ep.duration)}</itunes:duration>
      <itunes:explicit>${escapeXml(podcast.explicit)}</itunes:explicit>
      <itunes:episodeType>full</itunes:episodeType>
    </item>
`
  }

  xml += `  </channel>
</rss>`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
