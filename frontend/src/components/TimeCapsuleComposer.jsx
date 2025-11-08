import React from 'react'
import { IconLock, IconCalendar } from '@tabler/icons-react'
import PostCard from './PostCard'

export default function ScheduledPostCard({ 
  post, 
  authorName, 
  authorUsername, 
  authorAvatarUrl, 
  authorAccountId,
  viewerAccountId,
  canDelete,
  onDelete 
}) {
  const isReleased = post.isReleased || new Date(post.scheduledDate) <= new Date()
  const scheduledDate = new Date(post.scheduledDate)
  const now = new Date()
  const timeUntilRelease = scheduledDate - now

  // Use post.author if available, otherwise use props
  const displayName = authorName || post.author?.name || 'Anonymous'
  const displayUsername = authorUsername || post.author?.username || 'anonymous'
  const displayAvatar = authorAvatarUrl || post.author?.avatarUrl || null

  // Format time until release
  const formatTimeUntilRelease = () => {
    if (timeUntilRelease <= 0) return 'Released'
    
    const days = Math.floor(timeUntilRelease / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeUntilRelease % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeUntilRelease % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  if (isReleased) {
    // Show full post if released
    return (
      <PostCard
        post={post}
        authorName={authorName}
        authorUsername={authorUsername}
        authorAvatarUrl={authorAvatarUrl}
        authorAccountId={authorAccountId}
        viewerAccountId={viewerAccountId}
        canDelete={canDelete}
        onDelete={onDelete}
      />
    )
  }

  // Show blurred preview if not released
  return (
    <div className="relative rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Author Info - Always Visible (Not Blurred) */}
      <div className="relative z-30 p-4 flex items-center gap-3 border-b border-zinc-100 bg-white">
        <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden">
          {displayAvatar ? (
            <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-zinc-500 text-sm font-semibold">
              {displayName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div>
          <div className="font-semibold text-zinc-900">{displayName}</div>
          <div className="text-xs text-zinc-500">@{displayUsername}</div>
        </div>
        {/* Delete button for owner (if not released) */}
        {canDelete && onDelete && (
          <button
            onClick={onDelete}
            className="ml-auto p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
            title="Delete scheduled post"
          >
            <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content Area with Overlay */}
      <div className="relative min-h-[200px]">
        {/* Blurred Content */}
        <div className="relative blur-sm pointer-events-none select-none">
          {/* Content - Blurred */}
          <div className="p-4">
            {post.content && (
              <p className="text-zinc-900 whitespace-pre-wrap break-words mb-3">
                {post.content}
              </p>
            )}
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {post.images.slice(0, 4).map((img, idx) => (
                  <div key={idx} className="aspect-square bg-zinc-200 rounded-lg overflow-hidden">
                    <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            {!post.content && (!post.images || post.images.length === 0) && (
              <div className="p-8 text-center text-zinc-400">
                No content
              </div>
            )}
          </div>
        </div>

        {/* Overlay with Lock Icon and Release Info - Only covers content area */}
        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
              <IconLock className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold text-zinc-900 mb-1">Time Capsule Locked</div>
              <div className="text-sm text-zinc-600 mb-3">
                This post will be released on
              </div>
              <div className="flex items-center gap-2 text-zinc-900 font-medium justify-center">
                <IconCalendar className="w-5 h-5" />
                <span>{scheduledDate.toLocaleString()}</span>
              </div>
              {timeUntilRelease > 0 && (
                <div className="mt-2 text-xs text-zinc-500">
                  In {formatTimeUntilRelease()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

