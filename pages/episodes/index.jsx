import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import initialEpisodes from '../../data/episodes'

export default function EpisodesPage() {
  const [episodesList, setEpisodesList] = useState(initialEpisodes)
  const [activeEpisode, setActiveEpisode] = useState(null)

  useEffect(() => {
    fetch('/api/episodes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEpisodesList(data)
        }
      })
      .catch((err) => console.error('Failed to load episodes dynamically:', err))
  }, [])

  const sortedEpisodes = [...episodesList].sort(
    (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
  )

  const formatDuration = (durationStr) => {
    if (!durationStr) return ''
    const parts = durationStr.split(':')
    if (parts.length === 3) {
      const hrs = parseInt(parts[0], 10)
      const mins = parseInt(parts[1], 10)
      if (hrs > 0) {
        return `${hrs}h ${mins}m`
      }
      return `${mins}m`
    }
    return durationStr
  }

  const getRelativeTimeString = (dateString) => {
    // Current system local time from metadata context: 2026-07-10T11:55:36-04:00
    const now = new Date('2026-07-10T11:55:36-04:00')
    const publishDate = new Date(dateString)
    const diffMs = now - publishDate
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffSecs < 60) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffWeeks < 4) return `${diffWeeks}w ago`
    if (diffMonths < 12) return `${diffMonths}mo ago`
    return `${diffYears}y ago`
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
      <Head>
        <title key="title">Episodes | Between The Lines</title>
        <meta name="description" content="Browse and listen to all episodes of Between The Lines. Conversations about literature, faith, culture, and the books that shape how we see the world." key="description" />
        <link rel="canonical" href="https://catholicbookchat.com/episodes" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Episodes | Between The Lines" key="og:title" />
        <meta property="og:description" content="Browse and listen to all episodes of Between The Lines. Conversations about literature, faith, culture, and the books that shape how we see the world." key="og:description" />
        <meta property="og:url" content="https://catholicbookchat.com/episodes" key="og:url" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="Episodes | Between The Lines" key="twitter:title" />
        <meta name="twitter:description" content="Browse and listen to all episodes of Between The Lines. Conversations about literature, faith, culture, and the books that shape how we see the world." key="twitter:description" />
      </Head>
      <div className="flex flex-col items-center text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mt-3 text-[#2C1F1A]">Episodes</h2>
        <p className="mt-4 max-w-md text-[#5C4639] leading-relaxed">
          Conversations about literature, faith, culture, and the books that shape how we see the world.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedEpisodes.map((episode) => (
          <article
            key={episode.slug}
            className="relative overflow-hidden rounded-[32px] shadow-sm flex flex-col h-[480px] group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-[#e5d9c8]/25"
            style={{ backgroundColor: episode.cardColor || '#0E0B0A' }}
          >
            {/* Background Image (only if present) */}
            {episode.coverImage && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${episode.coverImage})` }}
                />
                {/* Dark Gradient Overlay for text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0B0A]/95 via-[#0E0B0A]/70 to-[#0E0B0A]/20" />
              </>
            )}

            {/* Overlay click block to detail page */}
            <Link href={`/episodes/${episode.slug}`} className="absolute inset-0 z-10" />

            {/* Content overlayed */}
            <div className="relative z-20 p-7 flex flex-col h-full justify-between pointer-events-none">
              {/* Top: Cover thumbnail or generic fallback icon */}
              <div>
                {episode.coverImage ? (
                  <img
                    src={episode.coverImage}
                    className="w-12 h-12 rounded-xl shadow-md object-cover border border-white/20"
                    alt=""
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="text-xl">🎙️</span>
                  </div>
                )}
              </div>

              {/* Bottom Info & Playbar */}
              <div className="w-full">
                <span className="text-white/60 text-xs font-semibold tracking-wider uppercase">
                  {getRelativeTimeString(episode.publishDate)}
                </span>

                <h3 className="font-sans font-bold text-xl md:text-2xl leading-tight text-white mt-1.5 mb-2 line-clamp-2">
                  {episode.title}
                </h3>

                <p className="text-white/70 text-sm leading-relaxed line-clamp-2 mb-6 font-light">
                  {episode.description}
                </p>

                {/* Controls Bar (clickable/interactive) */}
                <div className="flex items-center justify-between w-full pointer-events-auto">
                  {/* Play Button Pill */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setActiveEpisode(episode)
                    }}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/35 text-white text-xs md:text-sm font-semibold py-2.5 px-5 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer border border-white/10"
                  >
                    <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>{formatDuration(episode.duration)}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    {/* Download button */}
                    <a
                      href={`/audio/${episode.audioFile}?download=true`}
                      download
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md flex items-center justify-center text-white border border-white/10 transition-colors duration-200 cursor-pointer"
                      title="Download MP3"
                      aria-label="Download MP3"
                    >
                      <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 12l-4-4m4 4l4-4M4 19h16" />
                      </svg>
                    </a>

                    {/* More details dot button */}
                    <Link
                      href={`/episodes/${episode.slug}`}
                      className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md flex items-center justify-center text-white transition-colors duration-200 border border-white/10"
                      title="More details"
                    >
                      <svg className="w-5 h-5 text-white flex items-center justify-center" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM14 10a2 2 0 11-4 0 2 2 0 014 0zM22 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Persistent Bottom Audio Player Bar */}
      {activeEpisode && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e5d9c8]/20 px-6 py-4 shadow-2xl animate-fade-in"
          style={{ backgroundColor: activeEpisode.cardColor || '#0E0B0A' }}
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              {activeEpisode.coverImage ? (
                <img
                  src={activeEpisode.coverImage}
                  className="w-12 h-12 rounded-lg object-cover shadow border border-white/10"
                  alt=""
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
                  <span className="text-xl">🎙️</span>
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-white text-sm font-semibold truncate leading-tight">
                  {activeEpisode.title}
                </span>
                <span className="text-white/60 text-xs truncate">
                  Now playing...
                </span>
              </div>
            </div>

            <div className="flex-grow max-w-2xl w-full">
              <audio
                autoPlay
                controls
                key={activeEpisode.slug}
                className="w-full accent-[#B38B4D]"
              >
                <source src={`/audio/${activeEpisode.audioFile}`} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>

            <button
              onClick={() => setActiveEpisode(null)}
              className="text-white/60 hover:text-white transition-colors duration-200 p-1.5 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer"
              title="Close player"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

