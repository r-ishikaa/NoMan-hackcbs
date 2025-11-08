import { useState, useEffect } from 'react'
import { Clock, Lock } from 'lucide-react'

export default function ScheduledPostCard({ post, authorName, authorUsername, authorAvatarUrl }) {
  const [timeRemaining, setTimeRemaining] = useState(post.timeUntilRelease || 0)
  const [timeString, setTimeString] = useState('')

  useEffect(() => {
    if (!post.timeUntilRelease || post.isReleased) return

    const updateTime = () => {
      const now = Date.now()
      const scheduledTime = new Date(post.scheduledDate).getTime()
      const remaining = Math.max(0, scheduledTime - now)
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        setTimeString('Revealed!')
        return
      }

      // Calculate time units
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

      // Format time string
      if (days > 0) {
        setTimeString(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeString(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeString(`${minutes}m ${seconds}s`)
      } else {
        setTimeString(`${seconds}s`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [post.timeUntilRelease, post.scheduledDate, post.isReleased])

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-violet-200 hover:border-violet-300 transition-all p-6">
      {/* Author Info */}
      <div className="flex items-center gap-3 mb-4">
        {authorAvatarUrl ? (
          <img
            src={authorAvatarUrl}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover border-2 border-violet-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center border-2 border-violet-200">
            <span className="text-violet-600 font-bold text-sm">
              {authorName?.[0]?.toUpperCase() || authorUsername?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-zinc-900">{authorName || authorUsername}</p>
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Scheduled
            </span>
          </div>
          <p className="text-xs text-zinc-500">@{authorUsername}</p>
        </div>
      </div>

      {/* Hidden Content Placeholder */}
      <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-8 border-2 border-dashed border-violet-300">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-violet-600" />
          </div>
          <h3 className="text-lg font-bold text-violet-900 mb-2">Scheduled Post</h3>
          <p className="text-sm text-violet-700 mb-4">
            This post will be revealed in:
          </p>
          <div className="bg-white rounded-lg px-6 py-3 shadow-lg border-2 border-violet-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-600" />
              <span className="text-2xl font-bold text-violet-900">{timeString || 'Calculating...'}</span>
            </div>
          </div>
          <p className="text-xs text-violet-600 mt-4">
            Scheduled for {new Date(post.scheduledDate).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Post Stats (if any) */}
      {(post.likes > 0 || post.comments > 0) && (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-100">
          <span className="text-sm text-zinc-500">
            {post.likes} {post.likes === 1 ? 'like' : 'likes'}
          </span>
          <span className="text-sm text-zinc-500">
            {post.comments} {post.comments === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      )}
    </div>
  )
}
