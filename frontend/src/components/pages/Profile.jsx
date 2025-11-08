import React, { useEffect, useState, useRef, useCallback } from 'react'
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
import CollaborationModal from '../CollaborationModal'
import WalletConnect from '../WalletConnect'
import { communityData } from '../../data/CommunityData'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const Profile = () => {
  const { role } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState(null)
  const [counts, setCounts] = useState({ followers: 0, following: 0, reels: 0 })
  const [posts, setPosts] = useState([])
  const [communityPosts, setCommunityPosts] = useState([])
  const [communitiesMap, setCommunitiesMap] = useState(new Map())
  const [reels, setReels] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState('posts') // 'posts' or 'reels'
  const [postsSubTab, setPostsSubTab] = useState('myPosts') // 'myPosts' or 'community'
  const [selectedReel, setSelectedReel] = useState(null)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [collabModalOpen, setCollabModalOpen] = useState(false)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [connectedWallet, setConnectedWallet] = useState(null)
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
        const normalizedPosts = (Array.isArray(fetched) ? fetched : []).map((p) => {
          // Use post.author if available, otherwise fall back to profile data
          const author = p.author || {
            name: profile?.displayName || "Anonymous",
            username: profile?.accountId || accountId,
            avatarUrl: profile?.avatarUrl || null,
          };
          return {
            id: p.id || p._id,
            accountId: p.accountId,
            content: p.content,
            image: null,
            images: (p.images || []).map((u) => API_CONFIG.getApiUrl(u)),
            likes: Number(p.likes || p.likesCount || 0),
            comments: Number(p.comments || p.commentsCount || 0),
            timestamp: new Date(p.createdAt || Date.now()).toLocaleString(),
            community: p.community || null,
            author: author,
          };
        })
        
        // Separate regular posts from community posts
        const regularPosts = normalizedPosts.filter(p => !p.community)
        const commPosts = normalizedPosts.filter(p => p.community)
        setPosts(regularPosts)
        setCommunityPosts(commPosts)
        
        // Fetch community details for community posts
        if (commPosts.length > 0) {
          const slugify = (text) => text.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");
          const communityIds = [...new Set(commPosts.map(p => p.community).filter(Boolean))]
          try {
            const communitiesRes = await fetch(API_CONFIG.getApiUrl('/api/communities'))
            if (communitiesRes.ok) {
              const allCommunities = await communitiesRes.json()
              const staticMap = new Map(communityData.map(c => [slugify(c.communityName), c]))
              const map = new Map()
              allCommunities.forEach(c => {
                if (communityIds.some(id => String(id) === String(c._id))) {
                  // Enrich with static data for bgColor
                  const staticComm = staticMap.get(c.slug || slugify(c.name))
                  map.set(String(c._id), {
                    ...c,
                    bgColor: c.bgColor || staticComm?.bgColor || "bg-purple-300"
                  })
                }
              })
              // Also check static communities
              communityData.forEach(staticComm => {
                const slug = slugify(staticComm.communityName)
                allCommunities.forEach(c => {
                  if (communityIds.some(id => String(id) === String(c._id)) && 
                      (c.slug === slug || slugify(c.name) === slug)) {
                    if (!map.has(String(c._id))) {
                      map.set(String(c._id), {
                        ...c,
                        bgColor: staticComm.bgColor || "bg-purple-300"
                      })
                    }
                  }
                })
              })
              setCommunitiesMap(map)
            }
          } catch (err) {
            console.error('Failed to fetch communities:', err)
          }
        }

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
                        
                        {/* Wallet Connection Button - For all users */}
                        <button
                          onClick={() => setWalletModalOpen(true)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold hover:from-orange-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          {connectedWallet ? 'Wallet Connected' : 'Connect Wallet'}
                        </button>
                        
                        {(role === 'creator' || role === 'enterprise') && (
                          <Link 
                            to="/activity" 
                            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-all shadow-lg hover:shadow-xl"
                          >
                            Activity
                          </Link>
                        )}
                        <Link 
                          to="/dashboard" 
                          className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl"
                        >
                          Dashboard
                        </Link>
                      </>
                    ) : (
                      <>
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
                        
                        {/* Collaboration Button - Show only for creators/enterprises */}
                        {(profile.role === 'creator' || profile.role === 'enterprise') && (
                          <button
                            onClick={() => setCollabModalOpen(true)}
                            className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Collaborate
                      </button>
                        )}
                      </>
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
                  {posts.length + communityPosts.length}
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
                  <PostComposer onCreated={async (p) => {
                    // Refetch posts to get author information and proper formatting
                    try {
                      const accountId = profile?.accountId;
                      if (!accountId) return;
                      
                      const postsRes = await fetch(API_CONFIG.getApiUrl(`/posts?accountId=${encodeURIComponent(accountId)}`))
                      const fetched = postsRes.ok ? await postsRes.json() : []
                      const normalizedPosts = (Array.isArray(fetched) ? fetched : []).map((post) => {
                        const author = post.author || {
                          name: profile?.displayName || "Anonymous",
                          username: profile?.accountId || accountId,
                          avatarUrl: profile?.avatarUrl || null,
                        };
                        return {
                          id: post.id || post._id,
                          accountId: post.accountId,
                          content: post.content,
                          image: null,
                          images: (post.images || []).map((u) => API_CONFIG.getApiUrl(u)),
                          likes: Number(post.likes || post.likesCount || 0),
                          comments: Number(post.comments || post.commentsCount || 0),
                          timestamp: new Date(post.createdAt || Date.now()).toLocaleString(),
                          community: post.community || null,
                          author: author,
                        };
                      })
                      
                      // Separate regular posts from community posts
                      const regularPosts = normalizedPosts.filter(post => !post.community)
                      const commPosts = normalizedPosts.filter(post => post.community)
                      setPosts(regularPosts)
                      setCommunityPosts(commPosts)
                      
                      // Fetch community details if needed
                      if (commPosts.length > 0) {
                        const slugify = (text) => text.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");
                        const communityIds = [...new Set(commPosts.map(post => post.community).filter(Boolean))]
                        try {
                          const communitiesRes = await fetch(API_CONFIG.getApiUrl('/api/communities'))
                          if (communitiesRes.ok) {
                            const allCommunities = await communitiesRes.json()
                            const staticMap = new Map(communityData.map(c => [slugify(c.communityName), c]))
                            const map = new Map()
                            allCommunities.forEach(c => {
                              if (communityIds.some(id => String(id) === String(c._id))) {
                                const staticComm = staticMap.get(c.slug || slugify(c.name))
                                map.set(String(c._id), {
                                  ...c,
                                  bgColor: c.bgColor || staticComm?.bgColor || "bg-purple-300",
                                  communityName: c.name,
                                })
                              }
                            })
                            setCommunitiesMap(map)
                          }
                        } catch (error) {
                          console.error('Failed to fetch communities:', error)
                        }
                      }
                    } catch (error) {
                      console.error('Failed to refresh posts:', error);
                      // Fallback: add the post with basic info
                      if (p.community) {
                        setCommunityPosts((arr) => [p, ...arr])
                      } else {
                        setPosts((arr) => [p, ...arr])
                      }
                    }
                  }} />
                </div>
              )}
              
              {/* Posts Sub-tabs: My Posts | Community Posts */}
              {activeTab === 'posts' && (
                <div className="mb-6 border-b border-zinc-200">
                  <div className="flex gap-8">
                    <button
                      onClick={() => setPostsSubTab('myPosts')}
                      className={`pb-4 px-2 font-semibold text-sm transition-all relative ${
                        postsSubTab === 'myPosts'
                          ? 'text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      My Posts
                      {postsSubTab === 'myPosts' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900"></div>
                      )}
                    </button>
                    <button
                      onClick={() => setPostsSubTab('community')}
                      className={`pb-4 px-2 font-semibold text-sm transition-all relative ${
                        postsSubTab === 'community'
                          ? 'text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      Community Posts
                      {postsSubTab === 'community' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900"></div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Reel Composer */}
              {isSelf && activeTab === 'reels' && (
                <div className="mb-6">
                  <ReelComposer onCreated={(r) => setReels((arr) => [r, ...arr])} />
                </div>
              )}

              {/* Posts Content */}
              {activeTab === 'posts' && postsSubTab === 'myPosts' && (
                <div className="space-y-4">
                  {posts.length > 0 ? (
                    posts.map((p) => (
                      <PostCard
                        key={p.id}
                        post={p}
                        authorName={p.author?.name || profile.displayName}
                        authorUsername={p.author?.username || profile.accountId}
                        authorAvatarUrl={p.author?.avatarUrl || profile.avatarUrl}
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
              
              {/* Community Posts Content */}
              {activeTab === 'posts' && postsSubTab === 'community' && (
                <div className="space-y-6">
                  {communityPosts.length > 0 ? (
                    communityPosts.map((p) => {
                      const slugify = (text) => text.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");
                      const getColorVariants = (bgColor) => {
                        const colorMap = {
                          "bg-emerald-300": { button: "bg-emerald-600 hover:bg-emerald-700", border: "border-emerald-600" },
                          "bg-pink-300": { button: "bg-pink-600 hover:bg-pink-700", border: "border-pink-600" },
                          "bg-blue-300": { button: "bg-blue-600 hover:bg-blue-700", border: "border-blue-600" },
                          "bg-orange-300": { button: "bg-orange-600 hover:bg-orange-700", border: "border-orange-600" },
                          "bg-purple-300": { button: "bg-purple-600 hover:bg-purple-700", border: "border-purple-600" },
                          "bg-yellow-300": { button: "bg-yellow-600 hover:bg-yellow-700", border: "border-yellow-600" },
                          "bg-indigo-300": { button: "bg-indigo-600 hover:bg-indigo-700", border: "border-indigo-600" },
                          "bg-teal-300": { button: "bg-teal-600 hover:bg-teal-700", border: "border-teal-600" },
                          "bg-rose-300": { button: "bg-rose-600 hover:bg-rose-700", border: "border-rose-600" },
                          "bg-cyan-300": { button: "bg-cyan-600 hover:bg-cyan-700", border: "border-cyan-600" },
                          "bg-lime-300": { button: "bg-lime-600 hover:bg-lime-700", border: "border-lime-600" },
                          "bg-sky-300": { button: "bg-sky-600 hover:bg-sky-700", border: "border-sky-600" },
                        };
                        return colorMap[bgColor] || colorMap["bg-purple-300"];
                      };
                      const community = p.community ? communitiesMap.get(String(p.community)) : null
                      const colorVariants = community?.bgColor ? getColorVariants(community.bgColor) : getColorVariants("bg-purple-300")
                      return (
                        <div key={p.id} className="space-y-3">
                          {community && (
                            <Link to={`/communities/${community.slug || slugify(community.name)}`} className="block">
                              <div className={`flex items-center gap-2 -mb-1 transition-transform hover:scale-105`}>
                                <div className={`px-4 py-1.5 ${colorVariants.button} rounded-full text-sm font-semibold border-2 ${colorVariants.border} hover:shadow-md text-white`}>
                                  {community.name}
                                </div>
                              </div>
                            </Link>
                          )}
                          <PostCard
                            post={p}
                            authorName={p.author?.name || profile.displayName}
                            authorUsername={p.author?.username || profile.accountId}
                            authorAvatarUrl={p.author?.avatarUrl || profile.avatarUrl}
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
                                  setCommunityPosts((arr) => arr.filter((x) => x.id !== p.id))
                                }
                              } catch {}
                            }}
                          />
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 mx-auto mb-4 bg-zinc-100 rounded-2xl flex items-center justify-center">
                        <Grid className="h-10 w-10 text-zinc-400" />
                      </div>
                      <p className="text-zinc-600 font-semibold text-lg mb-2">No community posts yet</p>
                      {isSelf && (
                        <p className="text-sm text-zinc-500">Join communities and start posting!</p>
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

      {/* Collaboration Modal */}
      <CollaborationModal
        isOpen={collabModalOpen}
        onClose={() => setCollabModalOpen(false)}
        creatorProfile={profile}
      />

      {/* Wallet Connection Modal */}
      {walletModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Connect Wallet</h2>
              <button
                onClick={() => setWalletModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <WalletConnect
                onWalletConnected={(wallet) => {
                  setConnectedWallet(wallet);
                  if (wallet) {
                    setTimeout(() => setWalletModalOpen(false), 1500);
                  }
                }}
                currentWallet={connectedWallet}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    )
  }

export default Profile