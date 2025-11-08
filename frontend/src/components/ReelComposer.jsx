import React, { useState, useRef } from 'react'
import API_CONFIG from '../config/api'

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const ReelComposer = ({ onCreated }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleVideoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file')
      return
    }

    // Check file size (limit to 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('Video file must be less than 100MB')
      return
    }

    // Check duration (limit to 60 seconds) - make this optional for now
    const video = document.createElement('video')
    video.preload = 'metadata'

    const checkDuration = () => {
      if (video.duration > 60) {
        setError('Video must be 60 seconds or less')
        window.URL.revokeObjectURL(video.src)
        return false
      }
      return true
    }

    video.onloadedmetadata = () => {
      if (checkDuration()) {
        setVideoFile(file)
        setVideoPreview(URL.createObjectURL(file))
        setError('')
      }
    }

    // Timeout fallback in case metadata doesn't load
    setTimeout(() => {
      if (!videoFile && checkDuration()) {
        setVideoFile(file)
        setVideoPreview(URL.createObjectURL(file))
        setError('')
      }
      window.URL.revokeObjectURL(video.src)
    }, 3000)

    video.src = URL.createObjectURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !videoFile) return

    setLoading(true)
    setError('')
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('video', videoFile)

      const response = await fetch(API_CONFIG.getApiUrl('/reels/upload'), {
        method: 'POST',
        headers: {
          'Authorization': authHeaders()['Authorization']
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload reel')
      }

      if (data.reel) {
        onCreated && onCreated(data.reel)
        // Reset form
        setTitle('')
        setDescription('')
        setVideoFile(null)
        setVideoPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (err) {
      console.error('Reel upload error:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.status
      })
      setError(err.message || 'Failed to upload reel')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900 mb-4">Create New Reel</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your reel a catchy title..."
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            maxLength={100}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell viewers what your reel is about..."
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
            rows={2}
            maxLength={200}
            disabled={loading}
          />
          <div className="text-xs text-zinc-500 mt-1">
            {description.length}/200 characters
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Video *
          </label>
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-8 border-2 border-dashed border-zinc-300 rounded-lg hover:border-violet-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <div className="text-center">
                <div className="text-zinc-400 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-600">
                  {videoFile ? `Selected: ${videoFile.name}` : 'Click to select a video file'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  MP4, MOV, AVI • Max 100MB • 60 seconds max
                </p>
              </div>
            </button>

            {videoPreview && (
              <div className="mt-3">
                <video
                  src={videoPreview}
                  controls
                  className="w-full max-h-48 rounded-lg"
                  style={{ aspectRatio: '9/16' }}
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {uploadProgress > 0 && (
          <div className="w-full bg-zinc-200 rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={!title.trim() || !videoFile || loading}
            className="px-6 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </div>
            ) : (
              'Upload Reel'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ReelComposer
