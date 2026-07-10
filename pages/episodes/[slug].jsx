import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import initialEpisodes from '../../data/episodes'

export default function EpisodePage({ episode }) {
  const router = useRouter()
  const [episodeData, setEpisodeData] = useState(episode)
  const [loading, setLoading] = useState(!episode)

  useEffect(() => {
    // If we didn't receive props (new episode published dynamically), fetch details
    if (!episodeData && router.query.slug) {
      setLoading(true)
      fetch('/api/episodes')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const found = data.find((ep) => ep.slug === router.query.slug)
            if (found) {
              setEpisodeData(found)
            }
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [episode, router.query.slug])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-lg text-[#5C4639]">Loading episode details...</p>
      </div>
    )
  }

  if (!episodeData) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <h2 className="text-3xl font-semibold text-[#2C1F1A] mb-4">Episode not found</h2>
        <p className="text-[#5C4639] mb-6">We could not find that episode page.</p>
        <Link href="/episodes" className="btn btn-primary px-8">
          Back to Episodes
        </Link>
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-8">
      {/* Back Link */}
      <Link href="/episodes" className="text-sm font-medium text-[#B38B4D] hover:text-[#C9A35C] flex items-center gap-1">
        ← Back to Episodes
      </Link>

      {/* Episode Header */}
      <section className="bg-white border border-[#e5d9c8] rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-[#5C4639] mb-3">
          <span>{formatDate(episodeData.publishDate)}</span>
          <span className="px-2 py-0.5 rounded-full bg-[#F0E9DC] text-xs">⏱ {episodeData.duration}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[#2C1F1A] mb-2 leading-tight">
          {episodeData.title}
        </h2>
        <p className="text-lg text-[#B38B4D] font-medium italic mb-6">
          {episodeData.subtitle}
        </p>
        <p className="text-[#5C4639] leading-relaxed">
          {episodeData.description}
        </p>
      </section>

      {/* Listen Segment */}
      <section className="bg-white border border-[#e5d9c8] rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-[#2C1F1A] mb-4">Listen to this Episode</h3>
        <div className="audio-player-wrap border border-[#e5d9c8]">
          <audio controls preload="metadata">
            <source src={`/audio/${episodeData.audioFile}`} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </section>

      {/* Voices (Hosts & Guests) */}
      {(episodeData.host || episodeData.guest) && (
        <section className="w-full mt-4">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold tracking-tight mt-2 text-[#2C1F1A] font-serif">Hosts & Guests</h3>
          </div>

          <div className={`grid gap-6 mx-auto ${episodeData.host && episodeData.guest ? 'sm:grid-cols-2 max-w-2xl' : 'max-w-xs'}`}>
            {/* Host */}
            {episodeData.host && (
              <div className="host-card rounded-3xl p-6 flex flex-col items-center text-center shadow-sm bg-white border border-[#e5d9c8]">
                <div className="w-20 h-20 bg-[#EDE3D4] rounded-full mb-4 flex items-center justify-center ring-4 ring-[#F9F5ED]">
                  <span className="text-2xl text-[#B38B4D]">👤</span>
                </div>
                <h4 className="font-semibold text-lg text-[#2C1F1A]">{episodeData.host}</h4>
                <div className="text-[#B38B4D] text-xs tracking-widest mt-0.5 uppercase">Host</div>
              </div>
            )}

            {/* Guest */}
            {episodeData.guest && (
              <div className="host-card rounded-3xl p-6 flex flex-col items-center text-center shadow-sm bg-white border border-[#e5d9c8]">
                <div className="w-20 h-20 bg-[#EDE3D4] rounded-full mb-4 flex items-center justify-center ring-4 ring-[#F9F5ED]">
                  <span className="text-2xl text-[#B38B4D]">👤</span>
                </div>
                <h4 className="font-semibold text-lg text-[#2C1F1A]">{episodeData.guest}</h4>
                <div className="text-[#B38B4D] text-xs tracking-widest mt-0.5 uppercase">Guest</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Show Notes */}
      <section className="bg-white border border-[#e5d9c8] rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-[#2C1F1A] mb-4">Show Notes & Discuss</h3>
        <ul className="space-y-3">
          {episodeData.showNotes && episodeData.showNotes.map((note, index) => (
            <li key={index} className="flex gap-3 text-[#3F2A22] leading-relaxed">
              <span className="text-[#B38B4D] font-bold">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export function getStaticPaths() {
  return {
    paths: initialEpisodes.map((episode) => ({ params: { slug: episode.slug } })),
    fallback: false,
  }
}

export function getStaticProps({ params }) {
  const episode = initialEpisodes.find((item) => item.slug === params.slug) ?? null
  return {
    props: { episode },
  }
}
