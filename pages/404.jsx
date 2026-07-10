import Link from 'next/link'
import Head from 'next/head'

export default function NotFoundPage() {
  return (
    <section className="card">
      <Head>
        <title key="title">Page Not Found | Between The Lines</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <h2>Page not found</h2>
      <p>The page you requested does not exist.</p>
      <Link className="button" href="/">
        Return home
      </Link>
    </section>
  )
}
