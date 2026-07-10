import { useState, useEffect } from 'react'
import Link from 'next/link'
import initialEpisodes from '../../data/episodes'

export default function EpisodesPage() {
  const [episodesList, setEpisodesList] = useState(initialEpisodes)

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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col items-center text-center mb-12">
        <span className="uppercase tracking-[4px] text-xs font-semibold text-[#B38B4D]">THE ARCHIVE</span>
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mt-3 text-[#2C1F1A]">Episodes</h2>
        <p className="mt-4 max-w-md text-[#5C4639] leading-relaxed">
          Conversations about literature, faith, culture, and the books that shape how we see the world.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEpisodes.map((episode) => (
          <article key={episode.slug} className="episode-card-old card-old p-6 flex flex-col h-full bg-white">
            <div className="flex-grow">
              <div className="flex items-center gap-2 text-sm text-[#5C4639] mb-3">
                <span>{formatDate(episode.publishDate)}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#F0E9DC] text-xs">⏱ {episode.duration}</span>
              </div>
              
              <h3 className="font-semibold text-xl leading-tight mb-3 text-[#2C1F1A]">
                {episode.title}
              </h3>
              
              <p className="text-[#5C4639] text-[0.95rem] leading-relaxed line-clamp-3 mb-6">
                {episode.description}
              </p>
            </div>

            {/* Native Audio Player inside Card */}
            <div className="mt-auto pt-4 border-t border-[#e5d9c8]">
              <div className="mb-4">
                <audio controls preload="metadata" className="w-full accent-burgundy">
                  <source src={`/audio/${episode.audioFile}`} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/episodes/${episode.slug}`}
                  className="btn btn-primary flex-1 text-center text-sm py-2.5"
                >
                  Show Notes
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
