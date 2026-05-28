import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Misinformation Graveyard',
  description: 'Stories that were proven false, misleading, or retracted. Crypto\'s accountability archive.',
}

export default async function GraveyardPage() {
  const supabase = createServerSupabaseClient()
  const { data: stories } = await supabase
    .from('stories')
    .select(`*, profile:profiles!submitted_by(username, display_name), source:sources(name, domain, credibility_score)`)
    .eq('status', 'graveyard')
    .order('reviewed_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🪦</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Misinformation Graveyard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              Stories proven false, misleading, or retracted. The internet never forgets — neither do we.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-6 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
        <p className="text-sm text-red-700 dark:text-red-400">
          <strong>How stories end up here:</strong> Community members flag suspicious stories → 
          moderators investigate → stories with verified misinformation are moved here permanently.
          Sources that appear frequently have their credibility score reduced.
        </p>
      </div>

      {(!stories || stories.length === 0) ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-2">✅</p>
          <p className="font-medium">The graveyard is empty.</p>
          <p className="text-sm mt-1">No verified misinformation in the archive yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map(story => (
            <div key={story.id} className="card p-4 border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">🪦</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 line-through decoration-red-400">
                    <Link href={`/story/${story.id}`} className="hover:no-underline hover:text-red-600">
                      {story.title}
                    </Link>
                  </h3>
                  {story.moderator_note && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-0.5">🛡 Moderator note:</p>
                      <p className="text-sm text-red-600 dark:text-red-300">{story.moderator_note}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                    {story.source && <span>Source: <strong>{story.source.name}</strong></span>}
                    <span>Originally submitted {timeAgo(story.created_at)}</span>
                    {story.reviewed_at && <span>Debunked {timeAgo(story.reviewed_at)}</span>}
                    <a href={story.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-red-500 transition-colors">
                      Original link ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 card p-5 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Found a story that should be here? Flag it for moderator review.
        </p>
        <Link href="/" className="btn-secondary text-sm">← Back to Feed</Link>
      </div>
    </div>
  )
}
