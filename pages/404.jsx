import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <section className="card">
      <h2>Page not found</h2>
      <p>The page you requested does not exist.</p>
      <Link className="button" href="/">
        Return home
      </Link>
    </section>
  )
}
