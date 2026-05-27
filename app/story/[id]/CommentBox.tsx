'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function CommentBox({ storyId }: { storyId: string }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const submit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }
    await supabase.from('comments').insert({
      story_id: storyId, user_id: user.id, content: text.trim()
    })
    setText('')
    setDone(true)
    setTimeout(() => { setDone(false); window.location.reload() }, 1000)
    setSubmitting(false)
  }

  return (
    <div className="mb-6">
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Share your take…" rows={3} maxLength={5000}
        className="input resize-none mb-2" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{text.length}/5000</span>
        <button onClick={submit} disabled={submitting || !text.trim()} className="btn-primary">
          {done ? '✓ Posted!' : submitting ? 'Posting…' : 'Post Comment'}
        </button>
      </div>
    </div>
  )
}
