import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import API_CONFIG from '../../config/api.js'
// Using vertical snap feed; Apple-style card is rendered inline per item

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Sample reels for when database is empty
const SAMPLE_REELS = [
  {
    _id: 'sample-1',
    title: 'Master the Art of Productivity',
    script: 'Transform your daily routine with these simple productivity hacks that top performers swear by.',
    narration: 'Transform your daily routine with these simple productivity hacks that top performers swear by. Start by organizing your workspace, then focus on one task at a time. Remember, consistency beats intensity every single day.',
    totalDuration: 18,
    scenes: [
      {
        duration: 5,
        text: 'Master the Art of Productivity',
        description: 'Clean organized workspace',
        voiceover: 'Transform your daily routine with these simple productivity hacks',
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      },
      {
        duration: 6,
        text: 'Focus on one task at a time',
        description: 'Person working efficiently',
        voiceover: 'that top performers swear by. Start by organizing your workspace',
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      },
      {
        duration: 7,
        text: 'Consistency beats intensity',
        description: 'Calendar with daily tasks',
        voiceover: 'then focus on one task at a time. Remember, consistency beats intensity every single day.',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      }
    ],
    viewCount: 1250,
    likeCount: 89,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'sample-2',
    title: 'Quick Morning Routine for Success',
    script: 'Wake up early and start your day right with this energizing morning routine.',
    narration: 'Wake up early and start your day right with this energizing morning routine. Begin with five minutes of meditation, followed by a healthy breakfast and a quick workout. Your future self will thank you.',
    totalDuration: 16,
    scenes: [
      {
        duration: 4,
        text: 'Wake up early and start your day right',
        description: 'Sunrise morning scene',
        voiceover: 'Wake up early and start your day right',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      },
      {
        duration: 6,
        text: 'Meditation and healthy breakfast',
        description: 'Person meditating',
        voiceover: 'with this energizing morning routine. Begin with five minutes of meditation, followed by a healthy breakfast',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      },
      {
        duration: 6,
        text: 'Quick workout for energy',
        description: 'Person exercising',
        voiceover: 'and a quick workout. Your future self will thank you.',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      }
    ],
    viewCount: 980,
    likeCount: 67,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'sample-3',
    title: 'Learn Programming in 30 Days',
    script: 'Start your coding journey with these proven strategies that make learning programming fun and effective.',
    narration: 'Start your coding journey with these proven strategies that make learning programming fun and effective. Practice daily, build projects, and never stop learning. The best time to start was yesterday, the second best is now.',
    totalDuration: 20,
    scenes: [
      {
        duration: 5,
        text: 'Start your coding journey',
        description: 'Code on screen',
        voiceover: 'Start your coding journey with these proven strategies',
        imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      },
      {
        duration: 7,
        text: 'Practice daily and build projects',
        description: 'Developer working',
        voiceover: 'that make learning programming fun and effective. Practice daily, build projects',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      },
      {
        duration: 8,
        text: 'Never stop learning',
        description: 'Books and laptop',
        voiceover: 'and never stop learning. The best time to start was yesterday, the second best is now.',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      }
    ],
    viewCount: 2100,
    likeCount: 145,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'sample-4',
    title: 'Healthy Eating Made Simple',
    script: 'Discover easy meal prep tips that will save you time and keep you healthy all week long.',
    narration: 'Discover easy meal prep tips that will save you time and keep you healthy all week long. Plan your meals, prep in bulk, and enjoy nutritious food without the daily hassle.',
    totalDuration: 17,
    scenes: [
      {
        duration: 4,
        text: 'Healthy eating made simple',
        description: 'Fresh vegetables',
        voiceover: 'Discover easy meal prep tips',
        imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      },
      {
        duration: 6,
        text: 'Plan and prep in bulk',
        description: 'Meal prep containers',
        voiceover: 'that will save you time and keep you healthy all week long. Plan your meals, prep in bulk',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      },
      {
        duration: 7,
        text: 'Enjoy nutritious food daily',
        description: 'Healthy meal',
        voiceover: 'and enjoy nutritious food without the daily hassle.',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      }
    ],
    viewCount: 1560,
    likeCount: 112,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'sample-5',
    title: 'Mindfulness in 5 Minutes',
    script: 'Learn quick mindfulness techniques that you can practice anywhere, anytime.',
    narration: 'Learn quick mindfulness techniques that you can practice anywhere, anytime. Take deep breaths, focus on the present moment, and watch your stress melt away.',
    totalDuration: 15,
    scenes: [
      {
        duration: 4,
        text: 'Mindfulness in 5 minutes',
        description: 'Peaceful nature scene',
        voiceover: 'Learn quick mindfulness techniques',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      },
      {
        duration: 5,
        text: 'Practice anywhere, anytime',
        description: 'Person meditating',
        voiceover: 'that you can practice anywhere, anytime. Take deep breaths',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      },
      {
        duration: 6,
        text: 'Watch stress melt away',
        description: 'Calm peaceful scene',
        voiceover: 'focus on the present moment, and watch your stress melt away.',
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1080&h=1920&fit=crop',
        imageSource: 'Unsplash'
      }
    ],
    viewCount: 890,
    likeCount: 78,
    createdAt: new Date().toISOString()
  }
]

export default function ReelsFeed() {
  const { t } = useTranslation()
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const sceneTimerRef = useRef(null)
  const itemRefs = useRef([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  // Fetch reels
  const fetchReels = useCallback(async (pageNum = 1) => {
    try {
      const res = await fetch(API_CONFIG.getApiUrl(`/reels?page=${pageNum}&limit=10`), {
        headers: authHeaders()
      })
      const data = await res.json()
      
      if (data.success && data.reels && data.reels.length > 0) {
        if (pageNum === 1) {
          setReels(data.reels)
        } else {
          setReels(prev => [...prev, ...data.reels])
        }
        setHasMore(pageNum < data.pagination.pages)
      } else {
        // Use sample reels if database is empty
        if (pageNum === 1) {
          setReels(SAMPLE_REELS)
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error('Failed to fetch reels:', error)
      // Use sample reels on error
      if (pageNum === 1) {
        setReels(SAMPLE_REELS)
        setHasMore(false)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReels(1)
  }, [fetchReels])

  // Intersection observer to set active reel by viewport
  useEffect(() => {
    if (!reels || reels.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idxAttr = entry.target.getAttribute('data-index')
          const idx = idxAttr ? parseInt(idxAttr, 10) : -1
          if (entry.isIntersecting && entry.intersectionRatio > 0.6 && idx >= 0) {
            setActiveIndex(idx)
          }
        })
      },
      { threshold: [0.6] }
    )
    itemRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [reels])

  // Auto-advance scenes for the active reel (image-based reels)
  useEffect(() => {
    if (!reels || reels.length === 0) return
    const current = reels[activeIndex]
    if (!current) return
    if (current.videoUrl) {
      if (sceneTimerRef.current) clearInterval(sceneTimerRef.current)
      return
    }
    if (!playing) {
      if (sceneTimerRef.current) clearInterval(sceneTimerRef.current)
      return
    }
    setSceneIdx(0)
    if (sceneTimerRef.current) clearInterval(sceneTimerRef.current)
    if (Array.isArray(current.scenes) && current.scenes.length > 1) {
      sceneTimerRef.current = setInterval(() => {
        setSceneIdx((i) => (i + 1) % current.scenes.length)
      }, 2000)
    }
    return () => {
      if (sceneTimerRef.current) clearInterval(sceneTimerRef.current)
    }
  }, [activeIndex, reels, playing])

  // Infinite scroll - observe last item to fetch next page
  useEffect(() => {
    if (!hasMore || reels.length === 0) return
    const lastIndex = reels.length - 1
    const el = itemRefs.current[lastIndex]
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchReels(nextPage)
          io.disconnect()
        }
      })
    }, { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [reels, hasMore, page, fetchReels])

  const togglePlay = () => setPlaying((p) => !p)
  
  useEffect(() => () => { 
    clearInterval(sceneTimerRef.current)
    try { 
      if ('speechSynthesis' in window) window.speechSynthesis.cancel() 
    } catch (err) {
      console.error('Speech synthesis cleanup error:', err)
    }
  }, [])

  if (loading && reels.length === 0) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-zinc-600 text-lg">{t("common.loading")}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Vertical snap-scrolling feed */}
      <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
        {reels.map((reel, idx) => {
          const isActive = idx === activeIndex
          const currentScene = reel.videoUrl
            ? null
            : (reel.scenes?.[sceneIdx] || reel.scenes?.[0])
          return (
            <section
              key={reel._id || reel.id || idx}
              data-index={idx}
              ref={(el) => (itemRefs.current[idx] = el)}
              className="snap-start min-h-screen w-full flex items-center justify-center relative"
            >
              {/* Apple-style card container */}
              <div className="w-full max-w-[420px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl relative">
                {reel.videoUrl ? (
                  // Video reel
                  <video
                    src={API_CONFIG.getApiUrl(reel.videoUrl)}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    autoPlay={isActive}
                    loop
                  />
                ) : currentScene?.imageUrl ? (
                  // Image-based scene
                  <img
                    src={currentScene.imageUrl}
                    alt="scene"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // Fallback
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 text-white">
                    <div className="text-center">
                      <svg className="w-20 h-20 mx-auto mb-4 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <p className="font-semibold">{t('reels.noVideo')}</p>
                    </div>
                  </div>
                )}

                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                  <div className="text-white text-sm opacity-80 mb-1">
                    {idx + 1} / {reels.length}
                  </div>
                  <h3 className="text-white text-base font-semibold line-clamp-2">
                    {reel.title || 'Untitled Reel'}
                  </h3>
                  {currentScene?.text && (
                    <div className="text-white/90 text-sm line-clamp-2 mt-1">{currentScene.text}</div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="px-4 py-1.5 rounded-full bg-white/95 text-black text-xs font-medium"
                    >
                      {playing ? t('common.pause') : t('common.play')}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

