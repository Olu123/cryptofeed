import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StoryCard from '@/components/StoryCard'
import { formatDate, formatKarma, blueskyUrl, twitterUrl } from '@/lib/utils'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return { title: `@${params.username} on CryptoFeed` }
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('username', params.username).single()
  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  const [{ data: stories }, { data: predictions }] = await Promise.all([
    supabase.from('stories')
      .select(`*, source:sources(name, domain, logo_url, credibility_score), narrative:narratives(title, slug)`)
      .eq('submitted_by', profile.id)
      .eq('status', 'approved')
      .order('published_at', { ascending: false })
      .limit(20),
    supabase.from('predictions')
      .select(`*, story:stories(id, title)`)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const accuracy = profile.prediction_accuracy
  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    moderator: 'bg-orange-100 text-orange-700',
    user: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : profile.username?.[0]?.toUpperCase()
            }
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.display_name || profile.username}
              </h1>
              <span className={`badge ${roleColors[profile.role]}`}>{profile.role}</span>
              {profile.is_pro && <span className="badge bg-brand-100 text-brand-700">⭐ Pro</span>}
              {profile.alpha_count > 0 && (
                <span className="badge bg-purple-100 text-purple-700">
                  ⚡ Alpha Reporter ({profile.alpha_count}x)
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">@{profile.username}</p>

            {profile.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{profile.bio}</p>}

            {/* Social handles */}
            <div className="flex gap-3 mt-3 flex-wrap">
              {profile.twitter_handle && (
                <a href={twitterUrl(profile.twitter_handle)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-sky-500 transition-colors">
                  <span>𝕏</span> @{profile.twitter_handle}
                </a>
              )}
              {profile.bluesky_handle && (
                <a href={blueskyUrl(profile.bluesky_handle)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500 transition-colors">
                  <span>🦋</span> {profile.bluesky_handle}
                </a>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <Link href="/settings" className="btn-secondary text-sm shrink-0">Edit Profile</Link>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
          {[
            { label: 'Karma', value: formatKarma(profile.karma), color: 'text-brand-500' },
            { label: 'Stories', value: (stories ?? []).length.toString() },
            { label: 'Alpha Breaks', value: profile.alpha_count.toString(), color: 'text-purple-600' },
            { label: 'Prediction Acc.', value: accuracy > 0 ? `${Math.round(accuracy * 100)}%` : '—', color: accuracy > 0.6 ? 'text-green-600' : '' },
            { label: 'Member since', value: formatDate(profile.created_at) },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className={`text-lg font-bold ${stat.color ?? 'text-gray-900 dark:text-white'}`}>{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Holdings disclosure */}
        {isOwnProfile && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Link href="/settings#disclosures" className="text-xs text-brand-500 hover:underline">
              💼 Manage token holdings disclosures →
            </Link>
          </div>
        )}
      </div>

      {/* Stories */}
      {(stories ?? []).length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
            Recent Submissions
          </h2>
          <div className="card divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden">
            {stories!.map(story => <StoryCard key={story.id} story={story as any} compact />)}
          </div>
        </div>
      )}

      {/* Predictions */}
      {(predictions ?? []).length > 0 && (
        <div>
          <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
            Predictions
          </h2>
          <div className="card divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden p-0">
            {predictions!.map(p => (
              <div key={p.id} className="p-4">
                <p className="text-sm text-gray-800 dark:text-gray-200">{p.content}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                  {p.story && <Link href={`/story/${p.story.id}`} className="text-brand-500 hover:underline truncate">{p.story.title}</Link>}
                  <span className={`badge ${
                    p.outcome === 'correct' ? 'bg-green-100 text-green-700' :
                    p.outcome === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.outcome === 'pending' ? '⏳ Pending' : p.outcome === 'correct' ? '✓ Correct' : '✗ Wrong'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
