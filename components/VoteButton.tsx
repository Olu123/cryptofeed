'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { VoteType } from '@/lib/types'

interface Props {
  storyId: string
  upvotes: number
  downvotes: number
  userVote?: VoteType | null
}

export default function VoteButton({ storyId, upvotes: initialUp, downvotes: initialDown, userVote: initialVote }: Props) {
  const [upvotes, setUpvotes] = useState(initialUp)
  const [downvotes, setDownvotes] = useState(initialDown)
  const [userVote, setUserVote] = useState<VoteType | null>(initialVote ?? null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleVote = async (type: VoteType) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    const isUnvote = userVote === type

    if (isUnvote) {
      await supabase.from('votes').delete().eq('story_id', storyId).eq('user_id', user.id)
      setUserVote(null)
      if (type === 'up') setUpvotes(v => v - 1)
      else setDownvotes(v => v - 1)
    } else {
      if (userVote) {
        // flip vote
        await supabase.from('votes').update({ vote: type }).eq('story_id', storyId).eq('user_id', user.id)
        if (userVote === 'up') { setUpvotes(v => v - 1); setDownvotes(v => v + 1) }
        else { setDownvotes(v => v - 1); setUpvotes(v => v + 1) }
      } else {
        await supabase.from('votes').insert({ story_id: storyId, user_id: user.id, vote: type })
        if (type === 'up') setUpvotes(v => v + 1)
        else setDownvotes(v => v + 1)
      }
      setUserVote(type)
    }
    setLoading(false)
  }

  const net = upvotes - downvotes

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => handleVote('up')}
        disabled={loading}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all',
          userVote === 'up'
            ? 'bg-brand-500 text-white scale-110'
            : 'text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/30'
        )}
        title="Upvote"
      >
        ▲
      </button>
      <span className={cn('text-xs font-bold font-mono min-w-[1.5rem] text-center',
        net > 0 ? 'text-brand-600 dark:text-brand-400' : net < 0 ? 'text-red-500' : 'text-gray-400'
      )}>
        {net}
      </span>
      <button
        onClick={() => handleVote('down')}
        disabled={loading}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all',
          userVote === 'down'
            ? 'bg-red-500 text-white scale-110'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
        )}
        title="Downvote"
      >
        ▼
      </button>
    </div>
  )
}
