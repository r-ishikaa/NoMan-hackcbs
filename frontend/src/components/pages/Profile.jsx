import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import API_CONFIG from '../../config/api'
import { 
  IconMapPin as MapPin, 
  IconLink as LinkIcon, 
  IconCalendar as Calendar, 
  IconSparkles as Sparkles,
  IconGrid3x3 as Grid,
  IconVideo as Video
} from '@tabler/icons-react'
import PostCard from '../PostCard'
import PostComposer from '../PostComposer'
import ReelComposer from '../ReelComposer'
import RoleSwitcher from '../RoleSwitcher'

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const Profile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState(null)
  const [counts, setCounts] = useState({ followers: 0, following: 0, reels: 0 })
  const [posts, setPosts] = useState([])
  const [reels, setReels] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [selectedReel, setSelectedReel] = useState(null)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [sceneIdx, setSceneIdx] = useState(0)
  const sceneTimerRef = useRef(null)
  const videoRef = useRef(null)
  
  useEffect(() => {
    return () => {
      if (sceneTimerRef.current) {
        clearInterval(sceneTimerRef.current)
      }
    }
  }, [])

  const startSceneAutoplay = useCallback((reel) => {
    if (!reel || reel.videoUrl || !Array.isArray(reel.scenes)) return
    if (sceneTimerRef.current) {
      clearInterval(sceneTimerRef.current)
    }
    if (reel.scenes.length > 1) {
      sceneTimerRef.current = setInterval(() => {
        setSceneIdx((idx) => (idx + 1) % reel.scenes.length)
      }, 2000)
    }
  }, [])

  const handleReelOpen = (reel) => {
    if (sceneTimerRef.current) {
      clearInterval(sceneTimerRef.current)
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      } catch {}
    }
    setSelectedReel(reel)
    setSceneIdx(0)
    setPlaying(true)
    setPlayerOpen(true)
  }

  useEffect(() => {
    if (!playerOpen) {
      if (sceneTimerRef.current) {
        clearInterval(sceneTimerRef.current)
      }
      return
    }
    if (!selectedReel) return
    if (selectedReel.videoUrl) return
    if (!playing) {
      if (sceneTimerRef.current) {
        clearInterval(sceneTimerRef.current)
      }
      return
    }
    startSceneAutoplay(selectedReel)
    return () => {
      if (sceneTimerRef.current) {
        clearInterval(sceneTimerRef.current)
      }
    }
  }, [playerOpen, selectedReel, playing, startSceneAutoplay])

  useEffect(() => {
    if (!playerOpen || !selectedReel?.videoUrl) {
      if (videoRef.current) {
        try {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
        } catch {}
      }
      return
    }
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [playerOpen, selectedReel, playing])

  useEffect(() => {
    let ran = false
    const run = async () => {
      if (ran) return; ran = true
      try {
        const meRes = await fetch(API_CONFIG.getApiUrl('/users/me'), { headers: authHeaders() })
        if (!meRes.ok) throw new Error('auth')
        const me = await meRes.json()
        const accountId = me?._id || me?.id
        if (!accountId) throw new Error('no-id')
        setMeId(accountId)

        let prRes = await fetch(API_CONFIG.getApiUrl(`/profiles?accountId=${encodeURIComponent(accountId)}`))
        let arr = prRes.ok ? await prRes.json() : []
        if ((!arr || arr.length === 0) && me?.username) {
          prRes = await fetch(API_CONFIG.getApiUrl(`/profiles?accountId=${encodeURIComponent(me.username)}`))
          arr = prRes.ok ? await prRes.json() : []
        }
        setProfile(arr?.[0] || null)

        const statsRes = await fetch(API_CONFIG.getApiUrl(`/follow/stats?accountId=${encodeURIComponent(accountId)}`))
        const stats = statsRes.ok ? await statsRes.json() : { followers: 0, following: 0 }
        setCounts({ followers: Number(stats.followers || 0), following: Number(stats.following || 0) })

        const prUserId = profile?._id || profile?.accountId || accountId
        const profileAccountId = profile?.accountId || accountId
        if (accountId && prUserId && String(profileAccountId) !== String(accountId)) {
          const stRes = await fetch(API_CONFIG.getApiUrl(`/follow/status?followingId=${encodeURIComponent(profileAccountId)}`), { headers: authHeaders() })
          if (stRes.ok) {
            const j = await stRes.json()
            setIsFollowing(!!j.following)
          }
        } else {
          setIsFollowing(false)
        }

        const postsRes = await fetch(API_CONFIG.getApiUrl(`/posts?accountId=${encodeURIComponent(accountId)}`))
        const fetched = postsRes.ok ? await postsRes.json() : []
        const normalizedPosts = (Array.isArray(fetched) ? fetched : []).map((p) => ({
          id: p.id || p._id,
          accountId: p.accountId,
          content: p.content,
          image: null,
          images: (p.images || []).map((u) => API_CONFIG.getApiUrl(u)),
          likes: Number(p.likes || p.likesCount || 0),
          comments: Number(p.comments || p.commentsCount || 0),
          timestamp: new Date(p.createdAt || Date.now()).toLocaleString(),
        }))
        setPosts(normalizedPosts)

        const reelsRes = await fetch(API_CONFIG.getApiUrl('/reels'), {
          headers: authHeaders()
        })
        const reelsData = reelsRes.ok ? await reelsRes.json() : { reels: [] }
        const allReels = Array.isArray(reelsData.reels) ? reelsData.reels : []

        // Filter reels to only those authored by the profile's account
        const targetAccountId = profileAccountId
        const authoredReels = allReels.filter((r) => {
          const authorId =
            (r.author && (r.author._id || r.author.id)) ||
            r.author ||
            (r.createdBy && (r.createdBy._id || r.createdBy.id)) ||
            r.createdBy ||
            r.accountId ||
            r.userId ||
            r.ownerId
          return targetAccountId && authorId && String(authorId) === String(targetAccountId)
        })

        const normalizedReels = authoredReels.map((r) => ({
          id: r.id || r._id,
          title: r.title || '',
          description: r.description || '',
          script: r.script || '',
          narration: r.narration || '',
          scenes: r.scenes || [],
          videoUrl: r.videoUrl || '',
          videoPath: r.videoPath || '',
          totalDuration: r.totalDuration || 0,
          duration: r.duration || 0,
          createdAt: r.createdAt,
          viewCount: r.viewCount || 0,
          likeCount: r.likeCount || 0,
          author: r.author || r.createdBy || null,
        }))
        setReels(normalizedReels)
        setCounts(prev => ({ ...prev, reels: normalizedReels.length }))
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => { ran = true }
  }, [profile?._id, profile?.accountId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <p className="text-red-600 text-lg font-semibold mb-2">No profile found</p>
          <p className="text-zinc-500">Please try again later</p>
        </div>
      </div>
    )
  }

  const isSelf = meId && profile?.accountId === meId
  const currentScene =
    selectedReel && !selectedReel.videoUrl
      ? selectedReel.scenes?.[sceneIdx] || selectedReel.scenes?.[0] || null
      : null

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 via-white to-zinc-50 flex justify-center">
      <div className="w-full max-w-6xl px-4 md:px-8">
        {/* Cover + Avatar Section */}
        <section className="relative w-full">
          {/* Cover Image */}
          <div className="relative h-64 md:h-80 w-full overflow-hidden">
            {profile.coverUrl ? (
              <>
                <img src={profile.coverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white"></div>
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
              </div>
            )}
          </div>

          {/* Profile Info Container */}
          <div className="relative px-6 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-20 md:-mt-16">
              {/* Avatar with Badge */}
              <div className="relative flex-shrink-0">
                <div className="h-36 w-36 md:h-44 md:w-44 rounded-full border-[6px] border-white bg-white shadow-2xl overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-white text-5xl font-bold">
                      {profile.displayName?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-white">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                </div>
              </div>

              {/* Name and Action Buttons */}
              <div className="flex-1 pb-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-2">
                      {profile.displayName || 'Unknown User'}
                    </h1>
                    <p className="text-lg text-zinc-600">@{profile.accountId}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap items-center">
                    {isSelf ? (
                      <>
                        <RoleSwitcher />
                        <Link 
                          to="/profile/edit" 
                          className="px-5 py-2.5 rounded-xl bg-white border-2 border-zinc-200 text-zinc-900 font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm"
                        >
                          Edit Profile
                        </Link>
                        <Link 
                          to="/dashboard" 
                          className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl"
                        >
                          Dashboard
                        </Link>
                      </>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const profileId = profile.accountId || profile._id
                            if (!profileId) return
                            
                            const url = API_CONFIG.getApiUrl('/follow')
                            const opts = isFollowing
                              ? { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ followingId: profileId }) }
                              : { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ followingId: profileId }) }
                            const res = await fetch(url, opts)
                            if (res.ok) {
                              setIsFollowing((v) => !v)
                              setCounts((c) => ({ ...c, followers: (c.followers || 0) + (isFollowing ? -1 : 1) }))
                            }
                          } catch {}
                        }}
                        className={`px-7 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl ${
                          isFollowing 
                            ? 'bg-white border-2 border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300' 
                            : 'bg-zinc-900 text-white hover:bg-zinc-800'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="px-6 md:px-8 mt-8">
          <div className="bg-white rounded-2xl shadow-md border border-zinc-200/80 p-6 hover:shadow-lg transition-shadow">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center group cursor-pointer">
                <div className="text-3xl md:text-4xl font-bold text-zinc-900 mb-1 group-hover:text-violet-600 transition-colors">
                  {posts.length}
                </div>
                <div className="text-sm text-zinc-600 font-medium">Posts</div>
              </div>
              <div className="text-center group cursor-pointer">
                <div className="text-3xl md:text-4xl font-bold text-zinc-900 mb-1 group-hover:text-violet-600 transition-colors">
                  {reels.length}
                </div>
                <div className="text-sm text-zinc-600 font-medium">Reels</div>
              </div>
              <div className="text-center group cursor-pointer">
                <div className="text-3xl md:text-4xl font-bold text-zinc-900 mb-1 group-hover:text-violet-600 transition-colors">
                  {counts.followers}
                </div>
                <div className="text-sm text-zinc-600 font-medium">Followers</div>
              </div>
              <div className="text-center group cursor-pointer">
                <div className="text-3xl md:text-4xl font-bold text-zinc-900 mb-1 group-hover:text-violet-600 transition-colors">
                  {counts.following}
                </div>
                <div className="text-sm text-zinc-600 font-medium">Following</div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        {profile.about && (
          <section className="px-6 md:px-8 mt-4">
            <div className="bg-white rounded-2xl shadow-md border border-zinc-200/80 p-6 hover:shadow-lg transition-shadow">
              <p className="text-zinc-700 text-base leading-relaxed whitespace-pre-line mb-4">
                {profile.about}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
                {profile.location && (
                  <span className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg">
                    <MapPin className="h-4 w-4 text-zinc-500" /> 
                    <span className="font-medium">{profile.location}</span>
                  </span>
                )}
                {profile.website && (
                  <span className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg">
                    <LinkIcon className="h-4 w-4 text-zinc-500" />
                    <a href={profile.website} target="_blank" rel="noreferrer" className="text-violet-600 hover:text-violet-700 font-medium hover:underline">
                      {profile.website}
                    </a>
                  </span>
                )}
                <span className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <span className="font-medium">
                    Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Content Tabs */}
        <section className="px-6 md:px-8 mt-6 pb-8">
          <div className="bg-white rounded-2xl shadow-md border border-zinc-200/80 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-200 bg-zinc-50/50">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
                  activeTab === 'posts' 
                    ? 'text-zinc-900 bg-white' 
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Grid className="h-5 w-5" />
                  <span>Posts</span>
                  <span className="ml-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-xs font-bold">
                    {posts.length}
                  </span>
                </div>
                {activeTab === 'posts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900 rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('reels')}
                className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
                  activeTab === 'reels' 
                    ? 'text-zinc-900 bg-white' 
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Video className="h-5 w-5" />
                  <span>Reels</span>
                  <span className="ml-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-xs font-bold">
                    {reels.length}
                  </span>
                </div>
                {activeTab === 'reels' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900 rounded-t-full"></div>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Post Composer */}
              {isSelf && activeTab === 'posts' && (
                <div className="mb-6">
                  <PostComposer onCreated={(p) => setPosts((arr) => [p, ...arr])} />
                </div>
              )}

              {/* Reel Composer */}
              {isSelf && activeTab === 'reels' && (
                <div className="mb-6">
                  <ReelComposer onCreated={(r) => setReels((arr) => [r, ...arr])} />
                </div>
              )}

              {/* Posts Content */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {posts.length > 0 ? (
                    posts.map((p) => (
                      <PostCard
                        key={p.id}
                        post={p}
                        authorName={profile.displayName}
                        authorUsername={profile.accountId}
                        authorAvatarUrl={profile.avatarUrl}
                        authorAccountId={p.accountId}
                        viewerAccountId={meId}
                        canDelete={isSelf && p.accountId === meId}
                        onDelete={async () => {
                          try {
                            const res = await fetch(API_CONFIG.getApiUrl(`/posts/${encodeURIComponent(p.id)}`), {
                              method: 'DELETE',
                              headers: authHeaders(),
                            })
                            if (res.ok) {
                              setPosts((arr) => arr.filter((x) => x.id !== p.id))
                            }
                          } catch {}
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 mx-auto mb-4 bg-zinc-100 rounded-2xl flex items-center justify-center">
                        <Grid className="h-10 w-10 text-zinc-400" />
                      </div>
                      <p className="text-zinc-600 font-semibold text-lg mb-2">No posts yet</p>
                      {isSelf && (
                        <p className="text-sm text-zinc-500">Share your first post to get started!</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reels Grid */}
              {activeTab === 'reels' && (
                <div>
                  {reels.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {reels.map((reel) => {
                        const thumbnail = reel.videoUrl ? null : (reel.scenes?.[0]?.imageUrl || null)
                        
                        return (
                          <div 
                            key={reel.id} 
                            className="group relative bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.03] transition-all shadow-lg hover:shadow-2xl"
                            onClick={() => handleReelOpen(reel)}
                          >
                            {/* Thumbnail */}
                            <div className="aspect-[9/16] relative overflow-hidden">
                              {reel.videoUrl ? (
                                <video
                                  src={API_CONFIG.getApiUrl(reel.videoUrl)}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  onMouseEnter={(e) => {
                                    e.target.currentTime = 0
                                    e.target.play().catch(() => {})
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.pause()
                                    e.target.currentTime = 0
                                  }}
                                />
                              ) : thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={reel.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextElementSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              
                              {/* Fallback */}
                              <div 
                                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600" 
                                style={{ display: thumbnail ? 'none' : 'flex' }}
                              >
                                <svg className="w-16 h-16 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>

                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                              {/* Play Icon */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                                  <svg className="w-8 h-8 text-zinc-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>

                              {/* Duration Badge */}
                              {(reel.duration > 0 || reel.totalDuration > 0) && (
                                <div className="absolute top-3 right-3 px-2.5 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg text-white text-xs font-bold shadow-lg">
                                  {reel.duration > 0 ? `${reel.duration}s` : `${reel.totalDuration}s`}
                                </div>
                              )}

                              {/* View Count */}
                              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-lg">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                </svg>
                                {reel.viewCount > 999 ? `${(reel.viewCount / 1000).toFixed(1)}K` : reel.viewCount || 0}
                              </div>
                            </div>

                            {/* Reel Title */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                              <h3 className="text-white text-sm font-bold line-clamp-2 mb-1">
                                {reel.title || 'Untitled Reel'}
                              </h3>
                              {reel.likeCount > 0 && (
                                <div className="flex items-center gap-1 text-white/80 text-xs">
                                  <span>❤️</span>
                                  <span className="font-semibold">
                                    {reel.likeCount > 999 ? `${(reel.likeCount / 1000).toFixed(1)}K` : reel.likeCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 mx-auto mb-4 bg-zinc-100 rounded-2xl flex items-center justify-center">
                        <Video className="h-10 w-10 text-zinc-400" />
                      </div>
                      <p className="text-zinc-600 font-semibold text-lg mb-2">No reels yet</p>
                      {isSelf && (
                        <p className="text-sm text-zinc-500">Create your first reel to get started!</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Fullscreen Reel Player */}
      {playerOpen && selectedReel && (
        <div className="fixed inset-0 bg-white backdrop-blur-md z-50 flex items-center justify-center p-4">
          <button 
            onClick={() => { 
              setPlaying(false)
              setSceneIdx(0)
              if (sceneTimerRef.current) {
                clearInterval(sceneTimerRef.current)
              }
              if (videoRef.current) {
                try {
                  videoRef.current.pause()
                  videoRef.current.currentTime = 0
                } catch {}
              }
              setPlayerOpen(false)
            }} 
            className="absolute top-6 right-6 px-5 py-2.5 rounded-xl bg-white/95 hover:bg-white text-black font-semibold text-sm shadow-2xl transition-all hover:scale-105 z-10"
          >
            ✕ Close
          </button>

          <div className="w-full max-w-[420px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl relative">
            {selectedReel.videoUrl ? (
              <video
                ref={videoRef}
                src={API_CONFIG.getApiUrl(selectedReel.videoUrl)}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                onLoadedMetadata={() => {
                  if (playing && videoRef.current) {
                    videoRef.current.play().catch(() => {})
                  }
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            ) : currentScene?.imageUrl ? (
              <img src={currentScene.imageUrl} alt="scene" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 text-white">
                <div className="text-center">
                  <svg className="w-20 h-20 mx-auto mb-4 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <p className="font-semibold">No video available</p>
                </div>
              </div>
            )}

            {!selectedReel.videoUrl && Array.isArray(selectedReel.scenes) && selectedReel.scenes.length > 1 && (
              <div className="absolute top-5 left-5 right-5 z-20 flex gap-1">
                {selectedReel.scenes.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${idx <= sceneIdx ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/70 pointer-events-none"></div>

            <div className="absolute bottom-0 left-0 right-0 p-5 z-30 space-y-3 pointer-events-auto">
              <div className="text-white/70 text-xs uppercase tracking-wide font-semibold flex items-center gap-2 flex-wrap">
                {selectedReel.createdAt && (
                  <span>{new Date(selectedReel.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                )}
                {!selectedReel.videoUrl && selectedReel.scenes?.length > 0 && (
                  <span>
                    Scene {Math.min(sceneIdx + 1, selectedReel.scenes.length)} / {selectedReel.scenes.length}
                  </span>
                )}
              </div>

              <h3 className="text-white text-lg font-bold line-clamp-2">
                {selectedReel.title || 'Untitled Reel'}
              </h3>

              {currentScene?.text ? (
                <p className="text-white/85 text-sm leading-relaxed line-clamp-4">
                  {currentScene.text}
                </p>
              ) : selectedReel.description ? (
                <p className="text-white/85 text-sm leading-relaxed line-clamp-4">
                  {selectedReel.description}
                </p>
              ) : null}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="px-4 py-2 rounded-full bg-white/95 text-black text-sm font-semibold shadow hover:shadow-lg transition"
                >
                  {playing ? 'Pause' : 'Play'}
                </button>
                <div className="flex items-center gap-3 text-white/80 text-xs font-semibold">
                  <span>👀 {selectedReel.viewCount || 0}</span>
                  {selectedReel.likeCount ? <span>❤️ {selectedReel.likeCount}</span> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    )
  }

export default Profile