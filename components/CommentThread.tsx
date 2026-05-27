'use client'
import { useState } from 'react'
import Link from 'next/link'
import { timeAgo, blueskyUrl, twitterUrl } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import type { Comment } from '@/lib/types'

interface Props {
  comments: Comment[]
  storyId: string
  depth?: number
}

function CommentItem({ comment, storyId, depth = 0 }: { comment: Comment; storyId: string; depth?: number }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies ?? [])
  const supabase = createClient()

  const submitReply = async () => {
    if (!replyText.trim()) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    const { data } = await supabase.from('comments')
      .insert({ story_id: storyId, user_id: user.id, parent_id: comment.id, content: replyText.trim() })
      .select('*, profile:profiles(username, display_name, avatar_url, karma, role, twitter_handle, bluesky_handle)')
      .single()

    if (data) {
      setLocalReplies(prev => [...prev, data])
      setReplyText('')
      setShowReply(false)
    }
    setSubmitting(false)
  }

  if (comment.is_deleted) {
    return (
      <div className={`pl-${depth > 0 ? '4' : '0'} border-l-2 border-gray-100 dark:border-gray-800 ml-4`}>
        <p className="text-xs text-gray-400 italic py-2">[deleted]</p>
        {localReplies.length > 0 && (
          <CommentThread comments={localReplies} storyId={storyId} depth={depth + 1} />
        )}
      </div>
    )
  }

  return (
    <div className={depth > 0 ? 'border-l-2 border-gray-200 dark:border-gray-700 pl-4 ml-4' : ''}>
      <div className="py-3">
        {/* Author */}
        <div className="flex items-center gap-2 mb-1.5">
          {comment.profile?.avatar_url ? (
            <img src={comment.profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
              {comment.profile?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <Link href={`/profile/${comment.profile?.username}`}
            className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-brand-500 transition-colors">
            {comment.profile?.display_name || comment.profile?.username}
          </Link>
          {comment.profile?.role === 'moderator' && (
            <span className="badge bg-orange-100 text-orange-700 text-xs">MOD</span>
          )}
          {comment.profile?.role === 'admin' && (
            <span className="badge bg-red-100 text-red-700 text-xs">ADMIN</span>
          )}
          {/* Social handles */}
          {comment.profile?.twitter_handle && (
            <a href={twitterUrl(comment.profile.twitter_handle)} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-sky-500 transition-colors">𝕏</a>
          )}
          {comment.profile?.bluesky_handle && (
            <a href={blueskyUrl(comment.profile.bluesky_handle)} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors">🦋</a>
          )}
          <span className="text-xs text-gray-400 ml-auto">{timeAgo(comment.created_at)}</span>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-gray-400 hover:text-brand-500 transition-colors font-medium"
          >
            💬 Reply
          </button>
          <span className="text-xs text-gray-400">
            ▲ {comment.upvotes - comment.downvotes}
          </span>
        </div>

        {/* Reply box */}
        {showReply && (
          <div className="mt-2 flex gap-2">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              className="input flex-1 resize-none text-sm"
            />
            <div className="flex flex-col gap-1">
              <button onClick={submitReply} disabled={submitting || !replyText.trim()}
                className="btn-primary text-xs px-3 py-1.5">
                {submitting ? '…' : 'Post'}
              </button>
              <button onClick={() => setShowReply(false)} className="btn-secondary text-xs px-3 py-1.5">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {localReplies.length > 0 && depth < 5 && (
        <CommentThread comments={localReplies} storyId={storyId} depth={depth + 1} />
      )}
    </div>
  )
}

export default function CommentThread({ comments, storyId, depth = 0 }: Props) {
  return (
    <div className="space-y-1">
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} storyId={storyId} depth={depth} />
      ))}
    </div>
  )
}
