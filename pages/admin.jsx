import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [episodes, setEpisodes] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Upload/Form States
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

  // Load episodes once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchEpisodes()
    }
  }, [isAuthenticated])

  const verifyAuth = async (pass) => {
    setIsLoading(true)
    setError('')
    try {
      // Fetch episodes with password verification (GET doesn't require auth on server, but let's test it)
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

    // Generate safe kebab-case filename
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-')
      .replace(/-+/g, '-')

    setAudioFilename(safeName)
    setError('')

    // Automatically calculate duration
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

  // Create clean URL slugs
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
    
    // Check if slug is unique
    if (episodes.some(ep => ep.slug === slug)) {
      setError(`An episode with slug "${slug}" already exists. Please choose a different title.`)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 1. Upload audio file to R2
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

      // 2. Add episode object to metadata
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

      // Prepend to top of existing list
      const updatedEpisodes = [newEpisode, ...episodes]

      // 3. Write metadata to R2
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
        // Reset form
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
        
        // Refresh local list
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
    if (!confirm('Are you sure you want to delete this episode? This will delete its metadata from the website, but the audio file will remain in R2.')) {
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

  // Formatted date output helper
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
      <div className="max-w-md mx-auto my-20 px-6 py-8 bg-white border border-[#e5d9c8] rounded-3xl shadow-md text-center">
        <h2 className="text-3xl font-semibold text-[#2C1F1A] mb-2">Admin Login</h2>
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
    <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-12">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white border border-[#e5d9c8] rounded-3xl p-6 shadow-sm">
        <div>
          <h2 className="text-3xl font-semibold text-[#2C1F1A]">Admin Dashboard</h2>
          <p className="text-xs text-[#8C6F55]">Logged in & connected to R2 bucket</p>
        </div>
        <button
          onClick={handleLogout}
          className="btn text-sm py-2 px-5 border border-red-200 text-red-700 hover:bg-red-50"
        >
          Sign Out
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-sm">{success}</div>}

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Hand: Upload Form */}
        <section className="lg:col-span-7 bg-white border border-[#e5d9c8] rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-[#2C1F1A] mb-6">Publish New Episode</h3>
          
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

            {/* Audio File Picker */}
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

            {/* Show Notes */}
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

            {/* Upload Progress */}
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

        {/* Right Hand: Episode Archive Admin List */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-[#e5d9c8] rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-[#2C1F1A] mb-4">Published Episodes</h3>
            
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
    </div>
  )
}
