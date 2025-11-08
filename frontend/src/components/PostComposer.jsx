import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import API_CONFIG from '../config/api'
import { useAuth } from '../contexts/AuthContext'

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function PostComposer({ onCreated, communityId: propCommunityId }) {
  const [searchParams] = useSearchParams()
  const communityIdFromUrl = searchParams.get('community')
  const communityId = propCommunityId || communityIdFromUrl || null
  const { role } = useAuth()
  const isEnterprise = role === 'enterprise'
  
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [enrollments, setEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [assignmentName, setAssignmentName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isAdvertisement, setIsAdvertisement] = useState(false)
  const [advertisementTargetUrl, setAdvertisementTargetUrl] = useState('')
  const [advertisementBudget, setAdvertisementBudget] = useState('')
  const fileInputRef = useRef(null)

  const onPickFiles = (e) => {
    const selected = Array.from(e.target.files || [])
    const next = [...files, ...selected].slice(0, 6)
    setFiles(next)
  }

  const removeFileAt = (idx) => {
    setFiles((arr) => arr.filter((_, i) => i !== idx))
  }

  const submit = async () => {
    if (submitting) return
    if (!content.trim() && files.length === 0) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      const tags = `${selectedCourseId ? ` @course(${selectedCourseId})` : ''}${assignmentName.trim() ? ` @assignment(${assignmentName.trim()})` : ''}`
      fd.append('content', `${content.trim()}${tags}`.trim())
      fd.append('isAnonymous', isAnonymous.toString())
      if (communityId) {
        fd.append('community', communityId)
      }
      
      // Advertisement fields (only for enterprise)
      if (isEnterprise && isAdvertisement) {
        fd.append('isAdvertisement', 'true')
        fd.append('advertisementTargetUrl', advertisementTargetUrl.trim())
        fd.append('advertisementBudget', advertisementBudget.trim())
      }
      
      files.forEach((f) => fd.append('images', f))
      const res = await fetch(API_CONFIG.getApiUrl('/posts'), {
        method: 'POST',
        headers: { ...authHeaders() },
        body: fd,
      })
      if (res.ok) {
        const created = await res.json()
        onCreated && onCreated(formatPost(created))
        setContent('')
        setFiles([])
        setSelectedCourseId('')
        setAssignmentName('')
        setIsAnonymous(false)
        setIsAdvertisement(false)
        setAdvertisementTargetUrl('')
        setAdvertisementBudget('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [enrRes, crsRes] = await Promise.all([
          fetch(API_CONFIG.getApiUrl('/enrollments/me'), { headers: { ...authHeaders() }, cache: 'no-store' }),
          fetch(API_CONFIG.getApiUrl('/courses'))
        ])
        const enr = enrRes.ok ? await enrRes.json() : []
        const crs = crsRes.ok ? await crsRes.json() : []
        if (!cancelled) {
          setEnrollments(Array.isArray(enr) ? enr : [])
          setCourses(Array.isArray(crs) ? crs : [])
        }
      } catch (error) {
        console.error('Failed to fetch enrollments/courses:', error)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening?"
        className="w-full resize-y rounded-lg border border-zinc-200 p-3 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
        rows={3}
      />

      <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr,1fr] gap-3">
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 bg-white"
        >
          <option value="">Select course (optional)</option>
          {enrollments.map((e) => {
            const course = courses.find(c => String(c._id) === String(e.courseId))
            const label = course ? course.title : e.courseId
            return <option key={e._id || e.courseId} value={e.courseId}>{label}</option>
          })}
        </select>
        <input
          value={assignmentName}
          onChange={e => setAssignmentName(e.target.value)}
          placeholder="Assignment name (optional)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>

      {files.length > 0 && (
        <div className="my-3 grid grid-cols-2 gap-2 md:grid-cols-3 py-2">
          {files.map((f, idx) => (
            <div key={idx} className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-zinc-200">
              <img src={URL.createObjectURL(f)} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
              <button
                onClick={() => removeFileAt(idx)}
                className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs text-zinc-700 ring-1 ring-zinc-200"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {/* Advertisement Toggle (Enterprise only) */}
        {isEnterprise && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border-2 border-violet-200">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={isAdvertisement}
                onChange={(e) => setIsAdvertisement(e.target.checked)}
                disabled={isAnonymous}
                className="w-4 h-4 rounded border-violet-300 text-violet-900 focus:ring-2 focus:ring-violet-900 disabled:opacity-50"
              />
              <span className="text-sm font-semibold text-violet-900">Create Advertisement</span>
            </label>
            <span className="text-xs text-violet-700 font-medium">
              💰 Promote your content
            </span>
          </div>
        )}

        {/* Advertisement Fields (Enterprise only) */}
        {isEnterprise && isAdvertisement && (
          <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border-2 border-violet-200 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-violet-900 mb-2">
                Target URL (where users will be redirected on click)
              </label>
              <input
                type="url"
                value={advertisementTargetUrl}
                onChange={(e) => setAdvertisementTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-violet-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-violet-900 mb-2">
                Budget (USD)
              </label>
              <input
                type="number"
                value={advertisementBudget}
                onChange={(e) => setAdvertisementBudget(e.target.value)}
                placeholder="10.00"
                min="1"
                step="0.01"
                className="w-full rounded-lg border border-violet-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-xs text-violet-600 mt-1">
                Pricing: $0.01 per view, $0.10 per click, $0.05 per reaction
              </p>
            </div>
          </div>
        )}

        {/* Anonymous Toggle */}
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => {
                setIsAnonymous(e.target.checked)
                if (e.target.checked) setIsAdvertisement(false) // Can't be both anonymous and advertisement
              }}
              disabled={isAdvertisement}
              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
            />
            <span className="text-sm font-medium text-zinc-900">Post Anonymously</span>
          </label>
          <span className="text-xs text-zinc-500">
            {isAnonymous ? '🎭 Your identity will be hidden' : '👤 Post as yourself'}
          </span>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onPickFiles} className="text-sm" />
          <span className="text-xs text-zinc-500">Up to 6 images</span>
        </div>
        <button
          onClick={submit}
          disabled={submitting || (!content.trim() && files.length === 0)}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-60 transition-colors ${
              isAdvertisement 
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700' 
                : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
        >
            {submitting 
              ? 'Posting…' 
              : isAdvertisement 
                ? 'Post Advertisement' 
                : isAnonymous 
                  ? 'Post Anonymously' 
                  : 'Post'}
        </button>
        </div>
      </div>
    </div>
  )
}

function formatPost(p) {
  return {
    id: p.id || p._id,
    accountId: p.accountId,
    content: p.content,
    community: p.community || null,
    image: null,
    images: (p.images || []).map((u) => API_CONFIG.getApiUrl(u)),
    likes: Number(p.likes || p.likesCount || 0),
    comments: Number(p.comments || p.commentsCount || 0),
    timestamp: new Date(p.createdAt || Date.now()).toLocaleString(),
    author: p.author || null,
  }
}


