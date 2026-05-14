import Link from 'next/link'
import { useRouter } from 'next/router'
import '../styles/globals.css'

const links = [
  { href: '/', label: 'Home' },
  { href: '/episodes', label: 'Episodes' },
  { href: '/about', label: 'About' },
  { href: '/donate', label: 'Donate' },
]

export default function App({ Component, pageProps }) {
  const router = useRouter()

  return (
    <div className="site-shell">
      <header className="site-header">
        <p className="eyebrow">Podcast Website</p>
        <h1>Catholic Book Chat</h1>
        <p className="tagline">Faithful conversations on classic Catholic books.</p>
        <nav aria-label="Main navigation" className="main-nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${router.pathname === link.href ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="page-content">
        <Component {...pageProps} />
      </main>
    </div>
  )
}
