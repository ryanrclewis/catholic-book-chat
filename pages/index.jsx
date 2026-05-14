import Link from 'next/link'

export default function HomePage() {
  return (
    <section className="card hero-card">
      <h2>Read deeply. Listen prayerfully.</h2>
      <p>
        Catholic Book Chat pairs meaningful reading with faithful discussion. Each episode includes
        a Podbean player and notes to help your book club, family, or parish keep the conversation
        going.
      </p>
      <div className="button-row">
        <Link className="button" href="/episodes">
          Browse episodes
        </Link>
        <Link className="button button-soft" href="/donate">
          Support the podcast
        </Link>
      </div>
    </section>
  )
}
