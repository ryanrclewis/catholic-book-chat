import Link from 'next/link'
import episodes from '../../data/episodes'

export default function EpisodePage({ episode }) {
  if (!episode) {
    return (
      <section className="card">
        <h2>Episode not found</h2>
        <p>We could not find that episode page.</p>
        <Link className="button" href="/episodes">
          Back to episodes
        </Link>
      </section>
    )
  }

  return (
    <article className="stack">
      <section className="card">
        <h2>{episode.title}</h2>
        <p>{episode.subtitle}</p>
      </section>

      <section className="card">
        <h3>Listen on Podbean</h3>
        <div className="embed-wrap">
          <iframe
            title={`Podbean player for ${episode.title}`}
            src={episode.podbeanEmbedUrl}
            width="100%"
            height="315"
            loading="lazy"
            allow="autoplay"
          />
        </div>
      </section>

      <section className="card">
        <h3>Show notes</h3>
        <ul>
          {episode.showNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </article>
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
