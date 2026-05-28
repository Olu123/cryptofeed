import { createServerSupabaseClient } from '@/lib/supabase-server'
import StoryCard from '@/components/StoryCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Search — CryptoFeed' }

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? ''
  const supabase = createServerSupabaseClient()

  const { data: stories } = q ? await supabase
    .from('stories')
    .select(`*, profile:profiles!submitted_by(username, display_name, avatar_url, karma, alpha_count, twitter_handle, bluesky_handle), source:sources(name, domain, logo_url, credibility_score), narrative:narratives(title, slug)`)
    .eq('status', 'approved')
    .textSearch('title', q, { type: 'websearch', config: 'english' })
    .order('hot_score', { ascending: false })
    .limit(30)
  : { data: [] }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {q ? `Search: "${q}"` : 'Search CryptoFeed'}
      </h1>

      {!q && (
        <form action="/search" className="mb-6">
          <input name="q" placeholder="Search stories…" className="input max-w-md" autoFocus />
        </form>
      )}

      {q && (
        <p className="text-sm text-gray-500 mb-4">{(stories ?? []).length} results</p>
      )}

      {(stories ?? []).length > 0 ? (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden">
          {stories!.map(s => <StoryCard key={s.id} story={s as any} />)}
        </div>
      ) : q ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-3xl mb-2">🔍</p>
          <p>No results for "{q}"</p>
        </div>
      ) : null}
    </div>
  )
}
