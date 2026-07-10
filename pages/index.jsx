import { useState, useEffect } from 'react'
import Link from 'next/link'
import initialEpisodes from '../data/episodes'
import defaultContent from '../data/content'

export default function HomePage() {
  const [episodesList, setEpisodesList] = useState(initialEpisodes)
  const [copy, setCopy] = useState(defaultContent.home)

  useEffect(() => {
    fetch('/api/episodes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEpisodesList(data)
        }
      })
      .catch((err) => console.error('Failed to load episodes dynamically:', err))

    fetch('/api/content')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.home) {
          setCopy(data.home)
        }
      })
      .catch((err) => console.error('Failed to load page content dynamically:', err))
  }, [])

  // Sort episodes by date descending to find the latest
  const sortedEpisodes = [...episodesList].sort(
    (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
  )
  const latestEpisode = sortedEpisodes[0]

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <header
        className="hero min-h-[85vh] flex items-center relative overflow-hidden"
        style={{ backgroundImage: "url('/assets/hero.webp')" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-20 hero-content text-white text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 backdrop-blur text-xs tracking-[3px] font-semibold mb-6 border border-white/30">
            {copy.heroEyebrow}
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter mb-4 leading-none">
            {copy.heroTitle}
          </h1>
          <p className="max-w-2xl mx-auto text-xl md:text-2xl font-light text-white/90 tracking-tight mb-8 leading-relaxed">
            {copy.heroTagline}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/episodes" className="btn btn-gold px-10 text-base">
              Browse Episodes
            </Link>
            <a href="#listen" className="btn btn-secondary px-10 text-base">
              Where to Listen
            </a>
          </div>
          <div className="mt-6 text-xs tracking-widest text-white/60">
            {copy.newEpisodesFrequency}
          </div>
        </div>
      </header>

      {/* LATEST EPISODE */}
      {latestEpisode && (
        <section id="latest-episode" className="max-w-6xl mx-auto px-6 py-16 border-b border-[#e5d9c8] w-full">
          <div className="max-w-3xl mx-auto text-center">
            <div className="uppercase tracking-[3px] text-xs text-[#B38B4D] font-semibold mb-2">
              Latest Episode
            </div>
            <h3 className="text-3xl md:text-4xl font-semibold text-[#2C1F1A] mb-2 leading-tight">
              {latestEpisode.title}
            </h3>
            <div className="flex items-center justify-center gap-2 text-sm text-[#5C4639] mb-4">
              <span>{formatDate(latestEpisode.publishDate)}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#F0E9DC] text-xs">⏱ {latestEpisode.duration}</span>
            </div>
            <p className="text-[#5C4639] mb-6 text-lg max-w-2xl mx-auto leading-relaxed">
              {latestEpisode.description}
            </p>

            {/* Native Audio Player */}
            <div className="max-w-xl mx-auto mb-8 bg-[#f8f4ed] p-4 rounded-2xl border border-[#e5d9c8]">
              <audio controls preload="metadata" className="w-full accent-burgundy">
                <source src={`/audio/${latestEpisode.audioFile}`} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href={`/episodes/${latestEpisode.slug}`} className="btn btn-primary px-8">
                View Show Notes
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* WHERE TO LISTEN */}
      <section id="listen" className="bg-[#2F121E] text-white py-20 w-full">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="uppercase tracking-[3px] text-xs font-semibold text-[#B38B4D]">
            NEVER MISS AN EPISODE
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mt-4 mb-4">
            {copy.listenTitle}
          </h2>
          <p className="text-white/70 max-w-md mx-auto">
            {copy.listenDescription}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10 max-w-3xl mx-auto">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="listen-btn group hover:!border-[#B38B4D]"
            >
              <span className="text-2xl">🍎</span>
              <div className="text-left">
                <div className="font-semibold">Apple Podcasts</div>
                <div className="text-xs text-[#5C4639] group-hover:text-[#B38B4D]">Search “Between The Lines”</div>
              </div>
            </a>

            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="listen-btn group hover:!border-[#B38B4D]"
            >
              <span className="text-2xl">🎧</span>
              <div className="text-left">
                <div className="font-semibold">Spotify</div>
                <div className="text-xs text-[#5C4639] group-hover:text-[#B38B4D]">Follow for new episodes</div>
              </div>
            </a>

            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="listen-btn group hover:!border-[#B38B4D]"
            >
              <span className="text-2xl">▶️</span>
              <div className="text-left">
                <div className="font-semibold">YouTube</div>
                <div className="text-xs text-[#5C4639] group-hover:text-[#B38B4D]">Video versions</div>
              </div>
            </a>

            <a
              href="/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="listen-btn group hover:!border-[#B38B4D]"
            >
              <span className="text-2xl">📡</span>
              <div className="text-left">
                <div className="font-semibold">RSS Feed</div>
                <div className="text-xs text-[#5C4639] group-hover:text-[#B38B4D]">For any podcast app</div>
              </div>
            </a>
          </div>

          <div className="mt-10 text-sm text-white/50">
            Having trouble finding us? Email{' '}
            <a href={`mailto:${copy.listenEmail}`} className="underline hover:text-[#B38B4D]">
              {copy.listenEmail}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
