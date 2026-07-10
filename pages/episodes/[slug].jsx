import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import initialEpisodes from '../../data/episodes'

function TranscriptViewer({ transcript }) {
  const [isExpanded, setIsExpanded] = useState(false)
  if (!transcript) return null

  const paragraphs = transcript.split('\n\n').filter(p => p.trim() !== '')

  // Limit preview length to 300 characters in the collapsed state
  const COLLAPSE_LIMIT = 300
  let renderedParagraphs = paragraphs

  if (!isExpanded) {
    let count = 0
    renderedParagraphs = []
    for (const p of paragraphs) {
      if (count + p.length > COLLAPSE_LIMIT) {
        const remaining = COLLAPSE_LIMIT - count
        if (remaining > 20) {
          renderedParagraphs.push(p.slice(0, remaining).trim() + '...')
        } else if (renderedParagraphs.length === 0) {
          renderedParagraphs.push(p.slice(0, COLLAPSE_LIMIT).trim() + '...')
        } else {
          // Append ellipsis to the end of the last paragraph
          renderedParagraphs[renderedParagraphs.length - 1] =
            renderedParagraphs[renderedParagraphs.length - 1].trim() + '...'
        }
        break
      } else {
        renderedParagraphs.push(p)
        count += p.length
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Clickable Header Toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer group flex flex-col gap-1 select-none w-fit"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold text-[#2C1F1A] font-serif transition-colors duration-200">
            Transcript
          </h3>
          <svg
            className={`w-5 h-5 text-[#8C6F55] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <span className="text-sm text-[#8C6F55]/70">Automatically transcribed</span>
      </div>

      {/* Transcript Text */}
      <div className="space-y-4">
        {renderedParagraphs.map((p, index) => (
          <p key={index} className="text-sm md:text-[15px] text-[#3F2A22] leading-relaxed font-serif max-w-3xl">
            {p}
          </p>
        ))}
      </div>
    </div>
  )
}

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

  const formatDateTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' UTC'
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://catholicbookchat.com/assets/logo.jpg'
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    return `https://catholicbookchat.com${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
  }

  const seoImage = getImageUrl(episodeData.coverImage)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-8 w-full">
      <Head>
        <title key="title">{`${episodeData.title} | Between The Lines`}</title>
        <meta name="description" content={episodeData.description} key="description" />
        <link rel="canonical" href={`https://catholicbookchat.com/episodes/${episodeData.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" key="og:type" />
        <meta property="og:title" content={`${episodeData.title} | Between The Lines`} key="og:title" />
        <meta property="og:description" content={episodeData.description} key="og:description" />
        <meta property="og:url" content={`https://catholicbookchat.com/episodes/${episodeData.slug}`} key="og:url" />
        <meta property="og:image" content={seoImage} key="og:image" />
        
        {/* Twitter */}
        <meta name="twitter:title" content={`${episodeData.title} | Between The Lines`} key="twitter:title" />
        <meta name="twitter:description" content={episodeData.description} key="twitter:description" />
        <meta name="twitter:image" content={seoImage} key="twitter:image" />
      </Head>
      {/* Back Link */}
      <Link href="/episodes" className="text-sm font-medium text-[#B38B4D] hover:text-[#C9A35C] flex items-center gap-1 self-start transition-colors duration-200">
        ← Back to Episodes
      </Link>

      {/* Episode Header (Title & Subtitle) */}
      <header className="mb-2">
        <h1 className="text-3xl md:text-5xl font-semibold text-[#2C1F1A] mb-3 leading-tight font-serif">
          {episodeData.title}
        </h1>
        {episodeData.subtitle && (
          <p className="text-lg md:text-xl text-[#B38B4D] font-medium italic">
            {episodeData.subtitle}
          </p>
        )}
      </header>

      {/* Single Consolidated Content Card */}
      <div className="bg-white border border-[#e5d9c8] rounded-3xl shadow-sm overflow-hidden">
        {/* 1. Player with download button */}
        <section className="p-8 flex flex-row items-center gap-4 w-full">
          <div className="flex-grow w-full">
            <audio controls preload="metadata">
              <source src={`/audio/${episodeData.audioFile}`} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
          <div className="flex-shrink-0">
            <a
              href={`/audio/${episodeData.audioFile}?download=true`}
              download
              aria-label="Download MP3"
              title="Download MP3"
              className="bg-[#4A1C2E] hover:bg-[#2F121E] text-white w-12 h-12 flex items-center justify-center rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 17V3M12 17L6 11M12 17L18 11M4 21H20" />
              </svg>
            </a>
          </div>
        </section>

        {/* 2. Show description and notes */}
        <section className="p-8 flex flex-col gap-6">
          <div>
            <h3 className="text-2xl font-bold text-[#2C1F1A] font-serif mb-4">Description</h3>
            <p className="text-[#3F2A22] leading-relaxed text-base max-w-3xl">
              {episodeData.description}
            </p>
          </div>
          {episodeData.showNotes && episodeData.showNotes.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-[#2C1F1A] font-serif mb-4">Show Notes</h3>
              <ul className="space-y-3">
                {episodeData.showNotes.map((note, index) => (
                  <li key={index} className="flex gap-3 text-[#3F2A22] leading-relaxed">
                    <span className="text-[#B38B4D] font-bold select-none">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 3. hosts and guests */}
        {(episodeData.host || episodeData.guest) && (
          <section className="p-8">
            <h3 className="text-2xl font-bold text-[#2C1F1A] font-serif mb-4">Hosts & Guests</h3>
            <div className={`grid gap-6 ${episodeData.host && episodeData.guest ? 'md:grid-cols-2 max-w-2xl' : 'max-w-xs'}`}>
              {/* Host */}
              {episodeData.host && (
                <div className="rounded-2xl p-6 flex flex-col items-center text-center bg-[#F9F5ED]/40 border border-[#e5d9c8]/60 hover:shadow-md transition-shadow duration-300">
                  <div className="w-16 h-16 bg-[#EDE3D4] rounded-full mb-3 flex items-center justify-center ring-4 ring-[#F9F5ED] text-2xl select-none">
                    👤
                  </div>
                  <h4 className="font-semibold text-lg text-[#2C1F1A] font-serif">{episodeData.host}</h4>
                  <div className="text-[#B38B4D] text-xs font-semibold tracking-widest mt-1 uppercase">Host</div>
                </div>
              )}

              {/* Guest */}
              {episodeData.guest && (
                <div className="rounded-2xl p-6 flex flex-col items-center text-center bg-[#F9F5ED]/40 border border-[#e5d9c8]/60 hover:shadow-md transition-shadow duration-300">
                  <div className="w-16 h-16 bg-[#EDE3D4] rounded-full mb-3 flex items-center justify-center ring-4 ring-[#F9F5ED] text-2xl select-none">
                    🎙️
                  </div>
                  <h4 className="font-semibold text-lg text-[#2C1F1A] font-serif">{episodeData.guest}</h4>
                  <div className="text-[#B38B4D] text-xs font-semibold tracking-widest mt-1 uppercase">Guest</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. From this episode (external links) */}
        {episodeData.externalLinks && episodeData.externalLinks.length > 0 && (
          <section className="p-8">
            <h3 className="text-2xl font-bold text-[#2C1F1A] font-serif mb-4">From This Episode</h3>
            <ul className="space-y-3">
              {episodeData.externalLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#4A1C2E] hover:text-[#B38B4D] font-medium transition-colors duration-200"
                  >
                    <span className="text-xs select-none">🔗</span>
                    <span className="underline decoration-[#e5d9c8] hover:decoration-[#B38B4D]">{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 5. Transcript */}
        {episodeData.transcript && (
          <section className="p-8">
            <TranscriptViewer transcript={episodeData.transcript} />
          </section>
        )}

        {/* 6. Episode Information */}
        <section className="p-8">
          <h3 className="text-2xl font-bold text-[#2C1F1A] font-serif mb-4">Episode Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-[#8C6F55] font-semibold font-sans">Frequency</span>
              <span className="text-sm md:text-base text-[#2C1F1A] font-medium">{episodeData.frequency || 'Bi-weekly'}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-[#8C6F55] font-semibold font-sans">Published</span>
              <span className="text-sm md:text-base text-[#2C1F1A] font-medium">{formatDateTime(episodeData.publishDate)}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-[#8C6F55] font-semibold font-sans">Length</span>
              <span className="text-sm md:text-base text-[#2C1F1A] font-medium font-mono">{episodeData.duration}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-[#8C6F55] font-semibold font-sans">Episode Number</span>
              <span className="text-sm md:text-base text-[#2C1F1A] font-medium font-mono">
                {episodeData.episodeNumber !== undefined ? `#${episodeData.episodeNumber}` : 'Special'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-[#8C6F55] font-semibold font-sans">Rating</span>
              <span className="text-sm md:text-base text-[#2C1F1A] font-medium flex items-center gap-1">
                ⭐ {episodeData.rating || '5.0'}
              </span>
            </div>
          </div>
        </section>
      </div>
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
