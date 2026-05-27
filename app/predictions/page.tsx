import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Predictions',
  description: 'Timestamped predictions from the crypto community. Track who gets it right.',
}

export default async function PredictionsPage() {
  const supabase = createServerSupabaseClient()

  const { data: predictions } = await supabase
    .from('predictions')
    .select(`*, profile:profiles(username, display_name, avatar_url, prediction_accuracy, twitter_handle, bluesky_handle), story:stories(id, title)`)
    .order('created_at', { ascending: false })
    .limit(50)

  // Top predictors
  const { data: topPredictors } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, prediction_accuracy, karma')
    .gte('prediction_accuracy', 0.6)
    .order('prediction_accuracy', { ascending: false })
    .limit(5)

  const pending = (predictions ?? []).filter(p => p.outcome === 'pending')
  const resolved = (predictions ?? []).filter(p => p.outcome !== 'pending')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔮 Community Predictions</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Timestamped, public forecasts. No money — just reputation on the line. 
          Track who gets crypto right before it happens.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        <div>
          {pending.length > 0 && (
            <>
              <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
                ⏳ Active Predictions
              </h2>
              <div className="space-y-3 mb-6">
                {pending.map(p => (
                  <div key={p.id} className="card p-4">
                    <p className="text-gray-800 dark:text-gray-200 font-medium">{p.content}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                      <Link href={`/profile/${p.profile?.username}`}
                        className="font-semibold hover:text-brand-500">
                        @{p.profile?.username}
                      </Link>
                      {p.profile?.prediction_accuracy > 0 && (
                        <span className="badge bg-green-100 text-green-700">
                          {Math.round(p.profile.prediction_accuracy * 100)}% accurate
                        </span>
                      )}
                      <span>posted {timeAgo(p.created_at)}</span>
                      {p.resolve_by && <span>· resolves {timeAgo(p.resolve_by)}</span>}
                      {p.story && (
                        <Link href={`/story/${p.story.id}`}
                          className="text-brand-500 hover:underline truncate max-w-xs">
                          re: {p.story.title}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {resolved.length > 0 && (
            <>
              <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
                ✅ Resolved
              </h2>
              <div className="space-y-3">
                {resolved.map(p => (
                  <div key={p.id} className={`card p-4 border-l-4 ${
                    p.outcome === 'correct' ? 'border-l-green-500' : 'border-l-red-500'
                  }`}>
                    <p className="text-gray-700 dark:text-gray-300">{p.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Link href={`/profile/${p.profile?.username}`} className="font-semibold hover:text-brand-500">
                        @{p.profile?.username}
                      </Link>
                      <span className={`badge ${p.outcome === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.outcome === 'correct' ? '✓ Correct' : '✗ Wrong'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {(!predictions || predictions.length === 0) && (
            <div className="card p-12 text-center text-gray-400">
              <p className="text-4xl mb-2">🔮</p>
              <p>No predictions yet. Make one on any story page.</p>
            </div>
          )}
        </div>

        {/* Sidebar: Top Predictors */}
        <div>
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">🏆 Top Predictors</h3>
            {topPredictors && topPredictors.length > 0 ? (
              <ul className="space-y-3">
                {topPredictors.map((p, i) => (
                  <li key={p.username} className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-300 w-4">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {p.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${p.username}`}
                        className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-brand-500 truncate block">
                        @{p.username}
                      </Link>
                      <p className="text-xs text-green-600">{Math.round(p.prediction_accuracy * 100)}% accuracy</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">Make predictions on story pages to appear here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
