import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Head from 'next/head'
import '../styles/globals.css'

const links = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/about', label: 'About' },
  { href: '/donate', label: 'Donate' },
]

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F5ED] text-[#2C1F1A]">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

        {/* Global Fallback SEO Metadata */}
        <title key="title">Between The Lines</title>
        <meta name="description" content="Between The Lines - A Catholic Book Chat Podcast" key="description" />

        {/* Open Graph / Facebook */}
        <meta property="og:site_name" content="Between The Lines" key="og:site_name" />
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:title" content="Between The Lines" key="og:title" />
        <meta property="og:description" content="Between The Lines - A Catholic Book Chat Podcast" key="og:description" />
        <meta property="og:image" content="https://catholicbookchat.com/assets/logo.jpg" key="og:image" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
        <meta name="twitter:title" content="Between The Lines" key="twitter:title" />
        <meta name="twitter:description" content="Between The Lines - A Catholic Book Chat Podcast" key="twitter:description" />
        <meta name="twitter:image" content="https://catholicbookchat.com/assets/logo.jpg" key="twitter:image" />
      </Head>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#e5d9c8] bg-[#F9F5ED]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-[#EDE3D4] flex items-center justify-center text-xl ring-1 ring-[#d4c3a8] select-none" role="img" aria-label="Between The Lines logo">📖</span>
              <span className="font-semibold text-xl tracking-tight text-[#2C1F1A]">Between The Lines</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-9 text-sm font-medium">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link text-[#2C1F1A] ${router.pathname === link.href ? 'after:!w-full' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:block">
              <Link href="/#listen" className="btn btn-primary text-sm px-6 py-2.5">
                Subscribe
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-[#2C1F1A]"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#e5d9c8] bg-[#F9F5ED]">
            <div className="px-6 py-6 flex flex-col gap-4 text-sm font-medium">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-1"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/#listen" onClick={() => setMenuOpen(false)} className="btn btn-primary mt-2 w-full justify-center">
                Subscribe
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-20">
        <Component {...pageProps} />
      </main>

      {/* FOOTER */}
      <footer className="py-12 px-6 text-sm bg-[#2F121E] text-[#d4c3a8]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-y-6">
          <div>
            © {new Date().getFullYear()} Between The Lines. All rights reserved.
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/about" className="hover:text-[#C9A35C]">About</Link>
            <Link href="/episodes" className="hover:text-[#C9A35C]">Episodes</Link>
            <a href="/feed.xml" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A35C]">RSS Feed</a>
            <a href="mailto:hello@betweenthelines.fm" className="hover:text-[#C9A35C]">Contact</a>
          </div>

          <div className="text-xs text-[#8C6F55]">
            Design and engineered by <a href="https://archangel-laboratories.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A35C]">Archangel Laboratories</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
