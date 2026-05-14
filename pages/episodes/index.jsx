import Link from 'next/link'
import episodes from '../../data/episodes'

export default function EpisodesPage() {
  return (
    <section className="stack">
      <h2>Episodes</h2>
      <div className="grid">
        {episodes.map((episode) => (
          <article key={episode.slug} className="card episode-card">
            <h3>{episode.title}</h3>
            <p>{episode.subtitle}</p>
            <Link className="button" href={`/episodes/${episode.slug}`}>
              Open episode
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
