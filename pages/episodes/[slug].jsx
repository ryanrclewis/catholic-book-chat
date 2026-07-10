import Link from 'next/link'
import episodes from '../../data/episodes'

export default function EpisodePage({ episode }) {
  if (!episode) {
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
          <span>{formatDate(episode.publishDate)}</span>
          <span className="px-2 py-0.5 rounded-full bg-[#F0E9DC] text-xs">⏱ {episode.duration}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-[#2C1F1A] mb-2 leading-tight">
          {episode.title}
        </h2>
        <p className="text-lg text-[#B38B4D] font-medium italic mb-6">
          {episode.subtitle}
        </p>
        <p className="text-[#5C4639] leading-relaxed">
          {episode.description}
        </p>
      </section>

      {/* Listen Segment */}
      <section className="bg-white border border-[#e5d9c8] rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-[#2C1F1A] mb-4">Listen to this Episode</h3>
        <div className="audio-player-wrap border border-[#e5d9c8]">
          <audio controls preload="metadata">
            <source src={`/audio/${episode.audioFile}`} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </section>

      {/* Show Notes */}
      <section className="bg-white border border-[#e5d9c8] rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-[#2C1F1A] mb-4">Show Notes & Discuss</h3>
        <ul className="space-y-3">
          {episode.showNotes.map((note, index) => (
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
    paths: episodes.map((episode) => ({ params: { slug: episode.slug } })),
    fallback: false,
  }
}

export function getStaticProps({ params }) {
  const episode = episodes.find((item) => item.slug === params.slug) ?? null
  return {
    props: { episode },
  }
}
