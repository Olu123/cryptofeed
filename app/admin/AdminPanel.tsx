'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'

type Story = any
type Log = any

export default function AdminPanel({ pending, flagged, recentLogs, isAdmin }: {
  pending: Story[]; flagged: Story[]; recentLogs: Log[]; isAdmin: boolean
}) {
  const [tab, setTab] = useState<'pending' | 'flagged' | 'logs'>('pending')
  const [localPending, setLocalPending] = useState(pending)
  const [localFlagged, setLocalFlagged] = useState(flagged)
  const [note, setNote] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  const action = async (storyId: string, newStatus: string, moderatorNote?: string) => {
    setLoading(l => ({ ...l, [storyId]: true }))
    await supabase.from('stories').update({
      status: newStatus,
      moderator_note: moderatorNote ?? null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', storyId)
    setLocalPending(p => p.filter(s => s.id !== storyId))
    setLocalFlagged(f => f.filter(s => s.id !== storyId))
    setLoading(l => ({ ...l, [storyId]: false }))
  }

  const StoryRow = ({ story, showFlagCount }: { story: Story; showFlagCount?: boolean }) => (
    <div className="border-b border-gray-100 dark:border-gray-800 py-4 last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 text-xs">{story.category}</span>
            <span className="badge bg-blue-100 text-blue-700 text-xs">{story.news_type}</span>
            {showFlagCount && story.flagged_count > 0 && (
              <span className="badge bg-red-100 text-red-700 text-xs">🚩 {story.flagged_count} flags</span>
            )}
          </div>
          <Link href={`/story/${story.id}`} target="_blank"
            className="font-semibold text-gray-800 dark:text-gray-200 hover:text-brand-500 text-sm block">
            {story.title} ↗
          </Link>
          <div className="text-xs text-gray-400 mt-1 flex gap-3">
            <span>by @{story.profile?.username}</span>
            {story.source && <span>from {story.source.name}</span>}
            <span>{timeAgo(story.created_at)}</span>
            <a href={story.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-500">
              Source link ↗
            </a>
          </div>
        </div>
      </div>

      {/* Mod note */}
      <div className="mt-2">
        <input
          placeholder="Moderator note (optional, shown publicly if debunked)"
          value={note[story.id] ?? ''}
          onChange={e => setNote(n => ({ ...n, [story.id]: e.target.value }))}
          className="input text-xs py-1.5 w-full max-w-lg"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2 flex-wrap">
        <button onClick={() => action(story.id, 'approved', note[story.id])}
          disabled={loading[story.id]}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors">
          ✓ Approve
        </button>
        <button onClick={() => action(story.id, 'rejected', note[story.id])}
          disabled={loading[story.id]}
          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors">
          ✗ Reject
        </button>
        <button onClick={() => action(story.id, 'graveyard', note[story.id])}
          disabled={loading[story.id]}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
          🪦 Graveyard
        </button>
        {isAdmin && (
          <button onClick={() => supabase.from('stories').update({ is_pinned: true }).eq('id', story.id)}
            disabled={loading[story.id]}
            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-colors">
            📌 Pin
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🛡 Moderation Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {localPending.length} pending · {localFlagged.length} flagged
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'flagged', 'logs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}>
            {t === 'pending' ? `⏳ Pending (${localPending.length})` :
             t === 'flagged' ? `🚩 Flagged (${localFlagged.length})` : '📋 Activity Log'}
          </button>
        ))}
      </div>

      <div className="card p-5">
        {tab === 'pending' && (
          localPending.length === 0
            ? <p className="text-gray-400 text-sm text-center py-8">✅ No stories pending review</p>
            : localPending.map(s => <StoryRow key={s.id} story={s} />)
        )}
        {tab === 'flagged' && (
          localFlagged.length === 0
            ? <p className="text-gray-400 text-sm text-center py-8">✅ No flagged stories</p>
            : localFlagged.map(s => <StoryRow key={s.id} story={s} showFlagCount />)
        )}
        {tab === 'logs' && (
          <div className="space-y-2">
            {recentLogs.map((log: Log) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm">
                <span className="text-gray-400 text-xs w-32 shrink-0">{timeAgo(log.created_at)}</span>
                <span className="font-semibold text-brand-600">@{log.moderator?.username}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  <strong>{log.action}</strong> on {log.target_type}
                  {log.reason && <span className="text-gray-400"> — "{log.reason}"</span>}
                </span>
              </div>
            ))}
            {recentLogs.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No activity yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
