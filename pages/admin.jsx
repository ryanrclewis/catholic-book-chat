import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import defaultContent from '../data/content.js'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [episodes, setEpisodes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('episodes') // 'episodes' or 'content'

  // Sitewide Content Copy state
  const [contentCopy, setContentCopy] = useState(defaultContent)
  const [activeContentSubTab, setActiveContentSubTab] = useState('home') // 'home', 'about', 'donate'

  // Upload/Form States for Episodes
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [duration, setDuration] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [audioFile, setAudioFile] = useState(null)
  const [audioFilename, setAudioFilename] = useState('')
  const [showNotes, setShowNotes] = useState([''])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef(null)

  // Check login on load
  useEffect(() => {
    const saved = localStorage.getItem('btl_admin_password')
    if (saved) {
      setPassword(saved)
      verifyAuth(saved)
    }
  }, [])

  // Load episodes and content once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchEpisodes()
      fetchContentCopy()
    }
  }, [isAuthenticated])

  const verifyAuth = async (pass) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/episodes')
      if (res.ok) {
        localStorage.setItem('btl_admin_password', pass)
        setIsAuthenticated(true)
      } else {
        setError('Verification failed')
        setIsAuthenticated(false)
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (!password) {
      setError('Password is required')
      return
    }
    verifyAuth(password)
  }

  const handleLogout = () => {
    localStorage.removeItem('btl_admin_password')
    setPassword('')
    setIsAuthenticated(false)
    setEpisodes([])
  }

  const fetchEpisodes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/episodes')
      if (res.ok) {
        const data = await res.json()
        setEpisodes(data)
      } else {
        setError('Failed to fetch episodes list')
      }
    } catch (err) {
      setError('Failed to fetch episodes list')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchContentCopy = async () => {
    try {
      const res = await fetch('/api/content')
      if (res.ok) {
        const data = await res.json()
        setContentCopy(data)
      }
    } catch (err) {
      console.error('Failed to fetch dynamic copy, using static defaults:', err)
    }
  }

  // Generate duration and file size from uploaded file
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.mp3')) {
      setError('Only MP3 audio files are supported')
      return
    }

    setAudioFile(file)
    setFileSize(file.size)

    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-')
      .replace(/-+/g, '-')

    setAudioFilename(safeName)
    setError('')

    setIsLoading(true)
    try {
      const audio = document.createElement('audio')
      audio.preload = 'metadata'
      audio.src = URL.createObjectURL(file)
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src)
        const totalSeconds = Math.round(audio.duration)
        const hrs = Math.floor(totalSeconds / 3600)
        const mins = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60
        
        const formatted = [
          hrs.toString().padStart(2, '0'),
          mins.toString().padStart(2, '0'),
          secs.toString().padStart(2, '0')
        ].join(':')
        
        setDuration(formatted)
        setIsLoading(false)
      }
    } catch (err) {
      setIsLoading(false)
      setError('Could not calculate audio duration automatically')
    }
  }

  const handleAddNoteField = () => {
    setShowNotes([...showNotes, ''])
  }

  const handleRemoveNoteField = (index) => {
    const updated = showNotes.filter((_, i) => i !== index)
    setShowNotes(updated.length > 0 ? updated : [''])
  }

  const handleNoteChange = (index, value) => {
    const updated = [...showNotes]
    updated[index] = value
    setShowNotes(updated)
  }

  const generateSlug = (titleText) => {
    return titleText
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleSaveEpisode = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title || !description || !audioFilename || !duration || fileSize === 0) {
      setError('All fields are required, including an audio file.')
      return
    }

    const slug = generateSlug(title)
    
    if (episodes.some(ep => ep.slug === slug)) {
      setError(`An episode with slug "${slug}" already exists. Please choose a different title.`)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      if (audioFile) {
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', '/api/upload', true)
          xhr.setRequestHeader('Authorization', password)
          xhr.setRequestHeader('X-Filename', audioFilename)
          xhr.setRequestHeader('Content-Type', audioFile.type)

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100)
              setUploadProgress(percent)
            }
          }

          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText))
            } else {
              let errorMsg = 'Audio upload failed'
              try {
                errorMsg = JSON.parse(xhr.responseText).error || errorMsg
              } catch (e) {}
              reject(new Error(errorMsg))
            }
          }

          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.send(audioFile)
        })
      }

      const newEpisode = {
        slug,
        title,
        subtitle: subtitle || 'New Episode',
        description,
        publishDate: publishDate ? new Date(publishDate).toISOString() : new Date().toISOString(),
        duration,
        fileSize,
        audioFile: audioFilename,
        showNotes: showNotes.filter(n => n.trim() !== '')
      }

      const updatedEpisodes = [newEpisode, ...episodes]

      const saveRes = await fetch('/api/episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': password
        },
        body: JSON.stringify(updatedEpisodes)
      })

      if (saveRes.ok) {
        setSuccess('Episode uploaded and published successfully!')
        setTitle('')
        setSubtitle('')
        setDescription('')
        setPublishDate('')
        setDuration('')
        setFileSize(0)
        setAudioFile(null)
        setAudioFilename('')
        setShowNotes([''])
        if (fileInputRef.current) fileInputRef.current.value = ''
        
        setEpisodes(updatedEpisodes)
      } else {
        const errorData = await saveRes.json()
        setError(errorData.error || 'Failed to save metadata')
      }

    } catch (err) {
      setError(err.message || 'An error occurred during publication')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteEpisode = async (slugToDelete) => {
    if (!confirm('Are you sure you want to delete this episode? This will delete its metadata from the website, but the audio file will remain in the R2 bucket.')) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    const updatedEpisodes = episodes.filter(ep => ep.slug !== slugToDelete)

    try {
      const res = await fetch('/api/episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': password
        },
        body: JSON.stringify(updatedEpisodes)
      })

      if (res.ok) {
        setSuccess('Episode deleted successfully!')
        setEpisodes(updatedEpisodes)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to delete episode')
      }
    } catch (err) {
      setError('An error occurred during deletion')
    } finally {
      setIsLoading(false)
    }
  }

  // --- SITEPAGE COPY EDIT HANDLERS ---
  const handleContentFieldChange = (page, field, value) => {
    setContentCopy({
      ...contentCopy,
      [page]: {
        ...contentCopy[page],
        [field]: value
      }
    })
  }

  const handleContentListChange = (page, field, index, value) => {
    const list = [...contentCopy[page][field]]
    list[index] = value
    setContentCopy({
      ...contentCopy,
      [page]: {
        ...contentCopy[page],
        [field]: list
      }
    })
  }

  const handleAddContentListItem = (page, field) => {
    const list = [...contentCopy[page][field], '']
    setContentCopy({
      ...contentCopy,
      [page]: {
        ...contentCopy[page],
        [field]: list
      }
    })
  }

  const handleRemoveContentListItem = (page, field, index) => {
    const list = contentCopy[page][field].filter((_, i) => i !== index)
    setContentCopy({
      ...contentCopy,
      [page]: {
        ...contentCopy[page],
        [field]: list.length > 0 ? list : ['']
      }
    })
  }

  const handleSaveContentCopy = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': password
        },
        body: JSON.stringify(contentCopy)
      })

      if (res.ok) {
        setSuccess('Page copy updated successfully!')
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to update page copy')
      }
    } catch (err) {
      setError('An error occurred while saving page content')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch (e) {
      return 'Invalid date'
    }
  }

  // --- RENDER LOGIN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-20 px-6 py-8 bg-white border border-[#e5d9c8] rounded-3xl shadow-md text-center animate-fadeInScale">
        <h2 className="text-3xl font-semibold text-[#2C1F1A] mb-2 font-serif">Admin Login</h2>
        <p className="text-sm text-[#8C6F55] mb-6">Enter password to manage episodes & upload audio.</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Secret Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none text-center"
          />
          {error && <p className="text-red-700 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-3"
          >
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
      </div>
    )
  }

  // --- RENDER ADMIN DASHBOARD ---
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-8 animate-fadeInScale">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-[#e5d9c8] rounded-3xl p-6 shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-[#2C1F1A] font-serif">Admin Dashboard</h2>
          <p className="text-xs text-[#8C6F55]">Connected to Cloudflare R2 Bucket</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('episodes')}
            className={`btn text-sm py-2 px-5 ${activeTab === 'episodes' ? 'btn-primary' : 'border border-[#d4c3a8] text-[#4A1C2E] bg-white hover:bg-[#F9F5ED]'}`}
          >
            Manage Episodes
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`btn text-sm py-2 px-5 ${activeTab === 'content' ? 'btn-primary' : 'border border-[#d4c3a8] text-[#4A1C2E] bg-white hover:bg-[#F9F5ED]'}`}
          >
            Edit Page Copy
          </button>
          <button
            onClick={handleLogout}
            className="btn text-sm py-2 px-4 border border-red-200 text-red-700 bg-white hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-sm">{success}</div>}

      {/* TAB 1: MANAGE EPISODES */}
      {activeTab === 'episodes' && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Hand: Upload Form */}
          <section className="lg:col-span-7 bg-white border border-[#e5d9c8] rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-[#2C1F1A] mb-6 font-serif">Publish New Episode</h3>
            
            <form onSubmit={handleSaveEpisode} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Great Divorce — Chapter 2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Storing conversing context and chapter reflections"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  disabled={isUploading}
                  className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="A complete, reader-friendly summary of the episode details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                  className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Publish Date</label>
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    disabled={isUploading}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Calculated Duration</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="00:00:00"
                    value={duration}
                    disabled={true}
                    className="w-full border border-[#d4c3a8] bg-[#EDE3D4] px-4 py-3 rounded-2xl outline-none text-[#5C4639] font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Audio File (.mp3)</label>
                <input
                  type="file"
                  accept="audio/mpeg"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                  id="audio-uploader"
                />
                <label
                  htmlFor="audio-uploader"
                  className={`flex flex-col items-center justify-center border-2 border-dashed border-[#d4c3a8] rounded-2xl p-6 cursor-pointer hover:bg-[#F9F5ED] transition ${audioFile ? 'bg-green-50/50 border-green-300' : ''}`}
                >
                  {audioFile ? (
                    <div className="text-center">
                      <span className="text-3xl">🎵</span>
                      <p className="mt-2 text-sm font-semibold text-[#2C1F1A]">{audioFile.name}</p>
                      <p className="text-xs text-[#8C6F55]">{(fileSize / (1024 * 1024)).toFixed(2)} MB • {duration || 'Calculating duration...'}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl">📤</span>
                      <p className="mt-2 text-sm font-semibold text-[#2C1F1A]">Select Episode Audio File</p>
                      <p className="text-xs text-[#8C6F55]">Only .mp3 files are allowed</p>
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Show Notes (Bullet points)</label>
                <div className="flex flex-col gap-3">
                  {showNotes.map((note, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="e.g. Chapter 2 overview: the grey town context..."
                        value={note}
                        onChange={(e) => handleNoteChange(index, e.target.value)}
                        disabled={isUploading}
                        className="flex-grow border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-2.5 rounded-xl outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNoteField(index)}
                        className="p-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddNoteField}
                    className="btn text-xs py-2 border border-[#B38B4D] text-[#4A1C2E] hover:bg-[#F9F5ED] self-start"
                  >
                    + Add Bullet Point
                  </button>
                </div>
              </div>

              {isUploading && (
                <div className="w-full">
                  <div className="flex justify-between text-xs text-[#8C6F55] mb-1">
                    <span>Uploading MP3 & Publishing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#EDE3D4] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-burgundy h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading || isLoading}
                className="btn btn-primary w-full py-3.5 mt-2"
              >
                {isUploading ? `Uploading File (${uploadProgress}%)...` : 'Publish Episode'}
              </button>
            </form>
          </section>

          {/* Right Hand: Episode List */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white border border-[#e5d9c8] rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-[#2C1F1A] mb-4 font-serif">Published Episodes</h3>
              
              {isLoading && episodes.length === 0 ? (
                <p className="text-sm text-[#8C6F55]">Loading archive...</p>
              ) : episodes.length === 0 ? (
                <p className="text-sm text-[#8C6F55]">No episodes published yet.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-[75vh] overflow-y-auto pr-1">
                  {episodes.map((ep) => (
                    <div
                      key={ep.slug}
                      className="border border-[#e5d9c8] rounded-2xl p-4 hover:border-burgundy transition bg-[#F9F5ED]/40 flex justify-between items-start"
                    >
                      <div className="flex-grow pr-3">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#B38B4D] mb-1">
                          {formatDate(ep.publishDate)}
                        </div>
                        <h4 className="font-semibold text-[#2C1F1A] leading-tight text-sm mb-1">{ep.title}</h4>
                        <p className="text-[10px] text-[#8C6F55] font-mono">{ep.audioFile}</p>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteEpisode(ep.slug)}
                        disabled={isUploading}
                        className="p-2 border border-red-100 text-red-500 rounded-xl hover:bg-red-50 text-xs"
                        title="Delete Episode"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: EDIT PAGE COPY */}
      {activeTab === 'content' && (
        <form onSubmit={handleSaveContentCopy} className="bg-white border border-[#e5d9c8] rounded-3xl p-8 shadow-sm flex flex-col gap-8">
          <div className="flex justify-between items-center border-b border-[#e5d9c8] pb-4">
            <h3 className="text-xl font-semibold text-[#2C1F1A] font-serif">Edit Website Content Copy</h3>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-gold text-sm py-2 px-6"
            >
              {isLoading ? 'Saving...' : 'Save Content Copy'}
            </button>
          </div>

          {/* Sub-navigation for Pages */}
          <div className="flex border-b border-[#e5d9c8] gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveContentSubTab('home')}
              className={`pb-3 relative transition ${activeContentSubTab === 'home' ? 'text-[#B38B4D] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#B38B4D]' : 'text-[#8C6F55] hover:text-[#2C1F1A]'}`}
            >
              Home Page
            </button>
            <button
              type="button"
              onClick={() => setActiveContentSubTab('about')}
              className={`pb-3 relative transition ${activeContentSubTab === 'about' ? 'text-[#B38B4D] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#B38B4D]' : 'text-[#8C6F55] hover:text-[#2C1F1A]'}`}
            >
              About Page
            </button>
            <button
              type="button"
              onClick={() => setActiveContentSubTab('donate')}
              className={`pb-3 relative transition ${activeContentSubTab === 'donate' ? 'text-[#B38B4D] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#B38B4D]' : 'text-[#8C6F55] hover:text-[#2C1F1A]'}`}
            >
              Donate Page
            </button>
          </div>

          {/* --- SUB-TAB: HOME PAGE --- */}
          {activeContentSubTab === 'home' && (
            <div className="flex flex-col gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Hero Eyebrow</label>
                  <input
                    type="text"
                    required
                    value={contentCopy.home.heroEyebrow}
                    onChange={(e) => handleContentFieldChange('home', 'heroEyebrow', e.target.value)}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Hero Title</label>
                  <input
                    type="text"
                    required
                    value={contentCopy.home.heroTitle}
                    onChange={(e) => handleContentFieldChange('home', 'heroTitle', e.target.value)}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none font-serif text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Hero Tagline</label>
                <textarea
                  rows={2}
                  required
                  value={contentCopy.home.heroTagline}
                  onChange={(e) => handleContentFieldChange('home', 'heroTagline', e.target.value)}
                  className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none leading-relaxed resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Episode Release Note</label>
                  <input
                    type="text"
                    required
                    value={contentCopy.home.newEpisodesFrequency}
                    onChange={(e) => handleContentFieldChange('home', 'newEpisodesFrequency', e.target.value)}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Support Contact Email</label>
                  <input
                    type="email"
                    required
                    value={contentCopy.home.listenEmail}
                    onChange={(e) => handleContentFieldChange('home', 'listenEmail', e.target.value)}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Listen Panel Title</label>
                  <input
                    type="text"
                    required
                    value={contentCopy.home.listenTitle}
                    onChange={(e) => handleContentFieldChange('home', 'listenTitle', e.target.value)}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none font-serif"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Listen Panel Description</label>
                  <input
                    type="text"
                    required
                    value={contentCopy.home.listenDescription}
                    onChange={(e) => handleContentFieldChange('home', 'listenDescription', e.target.value)}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- SUB-TAB: ABOUT PAGE --- */}
          {activeContentSubTab === 'about' && (
            <div className="flex flex-col gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Mission Eyebrow</label>
                  <input
                    type="text"
                    required
                    value={contentCopy.about.missionEyebrow}
                    onChange={(e) => handleContentFieldChange('about', 'missionEyebrow', e.target.value)}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Mission Title</label>
                  <input
                    type="text"
                    required
                    value={contentCopy.about.missionTitle}
                    onChange={(e) => handleContentFieldChange('about', 'missionTitle', e.target.value)}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Mission Paragraph 1</label>
                <textarea
                  rows={3}
                  required
                  value={contentCopy.about.missionParagraph1}
                  onChange={(e) => handleContentFieldChange('about', 'missionParagraph1', e.target.value)}
                  className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Mission Paragraph 2</label>
                <textarea
                  rows={3}
                  required
                  value={contentCopy.about.missionParagraph2}
                  onChange={(e) => handleContentFieldChange('about', 'missionParagraph2', e.target.value)}
                  className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none leading-relaxed resize-none"
                />
              </div>

              {/* Topics list */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">WHAT WE TALK ABOUT Title</label>
                <input
                  type="text"
                  required
                  value={contentCopy.about.topicsTitle}
                  onChange={(e) => handleContentFieldChange('about', 'topicsTitle', e.target.value)}
                  className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none mb-4"
                />
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Discussion Topics List</label>
                <div className="flex flex-col gap-3">
                  {contentCopy.about.topics.map((topic, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        value={topic}
                        onChange={(e) => handleContentListChange('about', 'topics', index, e.target.value)}
                        className="flex-grow border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-2.5 rounded-xl outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveContentListItem('about', 'topics', index)}
                        className="p-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddContentListItem('about', 'topics')}
                    className="btn text-xs py-2 border border-[#B38B4D] text-[#4A1C2E] hover:bg-[#F9F5ED] self-start"
                  >
                    + Add Topic Item
                  </button>
                </div>
              </div>

              {/* Hosts Panel */}
              <div className="border-t border-[#e5d9c8] pt-6 flex flex-col gap-6">
                <h4 className="font-semibold text-lg text-[#2C1F1A] font-serif">{contentCopy.about.hostsTitle}</h4>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Host 1 */}
                  <div className="border border-[#e5d9c8] p-6 rounded-2xl bg-[#F9F5ED]/40 flex flex-col gap-4">
                    <h5 className="font-semibold text-[#4A1C2E] uppercase text-xs tracking-wider">Host 1 Profile</h5>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#8C6F55] mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={contentCopy.about.host1Name}
                        onChange={(e) => handleContentFieldChange('about', 'host1Name', e.target.value)}
                        className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-3 py-2 rounded-xl outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#8C6F55] mb-1">Role / Subtitle</label>
                      <input
                        type="text"
                        required
                        value={contentCopy.about.host1Role}
                        onChange={(e) => handleContentFieldChange('about', 'host1Role', e.target.value)}
                        className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-3 py-2 rounded-xl outline-none text-sm font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#8C6F55] mb-1">Biography</label>
                      <textarea
                        rows={3}
                        required
                        value={contentCopy.about.host1Bio}
                        onChange={(e) => handleContentFieldChange('about', 'host1Bio', e.target.value)}
                        className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-3 py-2 rounded-xl outline-none text-sm resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Host 2 */}
                  <div className="border border-[#e5d9c8] p-6 rounded-2xl bg-[#F9F5ED]/40 flex flex-col gap-4">
                    <h5 className="font-semibold text-[#4A1C2E] uppercase text-xs tracking-wider">Host 2 Profile</h5>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#8C6F55] mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={contentCopy.about.host2Name}
                        onChange={(e) => handleContentFieldChange('about', 'host2Name', e.target.value)}
                        className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-3 py-2 rounded-xl outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#8C6F55] mb-1">Role / Subtitle</label>
                      <input
                        type="text"
                        required
                        value={contentCopy.about.host2Role}
                        onChange={(e) => handleContentFieldChange('about', 'host2Role', e.target.value)}
                        className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-3 py-2 rounded-xl outline-none text-sm font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#8C6F55] mb-1">Biography</label>
                      <textarea
                        rows={3}
                        required
                        value={contentCopy.about.host2Bio}
                        onChange={(e) => handleContentFieldChange('about', 'host2Bio', e.target.value)}
                        className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-3 py-2 rounded-xl outline-none text-sm resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e5d9c8] pt-6">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Guest Call to Action Subtext</label>
                <input
                  type="text"
                  required
                  value={contentCopy.about.footerContactNote}
                  onChange={(e) => handleContentFieldChange('about', 'footerContactNote', e.target.value)}
                  className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none"
                />
              </div>
            </div>
          )}

          {/* --- SUB-TAB: DONATE PAGE --- */}
          {activeContentSubTab === 'donate' && (
            <div className="flex flex-col gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Support Eyebrow</label>
                  <input
                    type="text"
                    required
                    value={contentCopy.donate.supportEyebrow}
                    onChange={(e) => handleContentFieldChange('donate', 'supportEyebrow', e.target.value)}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Panel Title</label>
                  <input
                    type="text"
                    required
                    value={contentCopy.donate.title}
                    onChange={(e) => handleContentFieldChange('donate', 'title', e.target.value)}
                    className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Panel Description</label>
                <textarea
                  rows={2}
                  required
                  value={contentCopy.donate.description}
                  onChange={(e) => handleContentFieldChange('donate', 'description', e.target.value)}
                  className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none leading-relaxed resize-none"
                />
              </div>

              {/* Benefits list */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">Donation Funding Benefits List</label>
                <div className="flex flex-col gap-3">
                  {contentCopy.donate.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        value={benefit}
                        onChange={(e) => handleContentListChange('donate', 'benefits', index, e.target.value)}
                        className="flex-grow border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-2.5 rounded-xl outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveContentListItem('donate', 'benefits', index)}
                        className="p-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddContentListItem('donate', 'benefits')}
                    className="btn text-xs py-2 border border-[#B38B4D] text-[#4A1C2E] hover:bg-[#F9F5ED] self-start"
                  >
                    + Add Benefit Item
                  </button>
                </div>
              </div>

              <div className="border-t border-[#e5d9c8] pt-6">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#8C6F55] mb-2">PayPal Button ID Variable</label>
                <input
                  type="text"
                  required
                  value={contentCopy.donate.paypalButtonId}
                  onChange={(e) => handleContentFieldChange('donate', 'paypalButtonId', e.target.value)}
                  className="w-full border border-[#d4c3a8] focus:border-[#B38B4D] bg-[#F9F5ED] px-4 py-3 rounded-2xl outline-none font-mono text-sm"
                />
                <span className="text-[10px] text-[#8C6F55] mt-1 block">Specify the hosted Paypal button ID (e.g. <code>YOUR_PAYPAL_BUTTON_ID</code>)</span>
              </div>
            </div>
          )}

          <div className="border-t border-[#e5d9c8] pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary px-12 py-3.5 text-base"
            >
              {isLoading ? 'Saving Changes...' : 'Save Content Copy'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
