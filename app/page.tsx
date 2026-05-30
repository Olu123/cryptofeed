import { createServerSupabaseClient } from '@/lib/supabase-server'
import StoryCard from '@/components/StoryCard'
import type { FeedFilters, Story } from '@/lib/types'
import Link from 'next/link'

const CATEGORY_FILTERS = [
  { label: 'All', value: '' },
  { label: '₿ Bitcoin', value: 'bitcoin' },
  { label: 'Ξ Ethereum', value: 'ethereum' },
  { label: '🏦 DeFi', value: 'defi' },
  { label: '⚡ Layer 2', value: 'layer2' },
  { label: '◎ Solana', value: 'solana' },
  { label: '⚖️ Regulation', value: 'regulation' },
  { label: '🔒 Security', value: 'security' },
  { label: '🌍 Macro', value: 'macro' },
]

const TYPE_FILTERS = [
  { label: 'All Types', value: '' },
  { label: '⚡ Alpha', value: 'alpha' },
  { label: '📊 Fundamental', value: 'fundamental' },
  { label: '⚖️ Regulatory', value: 'regulatory' },
  { label: '🔧 Technical', value: 'technical' },
]

export default async function HomePage({
  searchParams,
}: {
  searchParams: { sort?: string; category?: string; type?: string; page?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sort = searchParams.sort ?? 'new'
  const category = searchParams.category ?? ''
  const type = searchParams.type ?? ''
  const page = parseInt(searchParams.page ?? '1', 10)
  const pageSize = 30
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('stories')
    .select(`
      *,
      profile:profiles!submitted_by(username, display_name, avatar_url, karma, alpha_count, twitter_handle, bluesky_handle),
      source:sources(name, domain, logo_url, credibility_score),
      narrative:narratives(title, slug)
    `)
    .eq('status', 'approved')

  if (category) query = query.eq('category', category)
  if (type) query = query.eq('news_type', type)

  if (sort === 'hot') query = query.order('hot_score', { ascending: false })
  else if (sort === 'new') query = query.order('published_at', { ascending: false })
  else if (sort === 'top') query = query.order('upvotes', { ascending: false })

  query = query.range(offset, offset + pageSize - 1)

  const { data: stories } = await query

  // Get user votes if logged in
  let userVoteMap: Record<string, 'up' | 'down'> = {}
  if (user && stories?.length) {
    const { data: votes } = await supabase
      .from('votes')
      .select('story_id, vote')
      .eq('user_id', user.id)
      .in('story_id', stories.map(s => s.id))
    if (votes) {
      userVoteMap = Object.fromEntries(votes.map(v => [v.story_id, v.vote]))
    }
  }

  const storiesWithVotes = (stories ?? []).map(s => ({
    ...s,
    user_vote: userVoteMap[s.id] ?? null,
  })) as Story[]

  // Pinned stories first
  const pinned = storiesWithVotes.filter(s => s.is_pinned)
  const regular = storiesWithVotes.filter(s => !s.is_pinned)
  const sorted = [...pinned, ...regular]

  // Story of the Day — highest credibility story from last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: storyOfDay } = await supabase
    .from('stories')
    .select(`*, source:sources(name, domain, credibility_score)`)
    .eq('status', 'approved')
    .gte('published_at', yesterday)
    .order('credibility_score', { ascending: false })
    .limit(1)
    .single()

  // Fetch trending narratives for sidebar
  const { data: narratives } = await supabase
    .from('narratives')
    .select('id, title, slug, category, story_count')
    .eq('is_active', true)
    .order('story_count', { ascending: false })
    .limit(6)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
      {/* Main Feed */}
      <div>
        {/* A-ADS — Desktop (728x90) */}
        <div className="hidden sm:block mb-4" style={{ width: '728px', maxWidth: '100%', margin: '0 auto 1rem' }}>
          <iframe
            data-aa='2439535'
            src='https://ad.a-ads.com/2439535/?size=728x90'
            style={{ border: 0, padding: 0, width: '728px', maxWidth: '100%', height: '90px', overflow: 'hidden', display: 'block', margin: 'auto' }}
          />
        </div>
        {/* A-ADS — Mobile (320x50) */}
        <div className="block sm:hidden mb-4" style={{ width: '320px', maxWidth: '100%', margin: '0 auto 1rem' }}>
          <iframe
            data-aa='2439555'
            src='https://ad.a-ads.com/2439555/?size=320x50'
            style={{ border: 0, padding: 0, width: '320px', maxWidth: '100%', height: '50px', overflow: 'hidden', display: 'block', margin: 'auto' }}
          />
        </div>

        {/* Story of the Day */}
        {storyOfDay && page === 1 && !category && !type && (
          <div className="mb-5 rounded-xl overflow-hidden border border-brand-300 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-orange-50 dark:from-brand-900/20 dark:to-orange-900/10">
            <div className="px-4 py-2 bg-brand-500 flex items-center gap-2">
              <span className="text-white text-xs font-bold uppercase tracking-widest">⭐ Story of the Day</span>
              <span className="ml-auto text-brand-100 text-xs">Highest credibility in the last 24h</span>
            </div>
            <div className="p-5">
              <Link href={`/story/${storyOfDay.id}`}
                className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors leading-snug block mb-2">
                {storyOfDay.title}
              </Link>
              {storyOfDay.summary && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                  {storyOfDay.summary}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                {storyOfDay.source && (
                  <span className="font-medium text-gray-700 dark:text-gray-300">{storyOfDay.source.name}</span>
                )}
                <span className="badge bg-green-100 text-green-700">
                  ✓ Credibility {storyOfDay.credibility_score}/100
                </span>
                <a href={storyOfDay.url} target="_blank" rel="noopener noreferrer"
                  className="ml-auto text-brand-500 hover:underline font-medium">
                  Read full story ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col gap-2 mb-4">
          {/* Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['hot', 'new', 'top'] as const).map(s => (
              <Link key={s} href={`/?sort=${s}&category=${category}&type=${type}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  sort === s
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>
                {s === 'hot' ? '🔥 Hot' : s === 'new' ? '⚡ New' : '📈 Top'}
              </Link>
            ))}
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
            {TYPE_FILTERS.map(f => (
              <Link key={f.value} href={`/?sort=${sort}&category=${category}&type=${f.value}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  type === f.value
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>
                {f.label}
              </Link>
            ))}
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORY_FILTERS.map(f => (
              <Link key={f.value} href={`/?sort=${sort}&category=${f.value}&type=${type}`}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  category === f.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors'
                }`}>
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stories */}
        <div className="card divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden">
          {sorted.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p className="font-medium">No stories yet in this filter.</p>
              <Link href="/submit" className="btn-primary inline-flex mt-4">Be the first to submit</Link>
            </div>
          ) : (
            sorted.map((story, i) => (
              <StoryCard key={story.id} story={story} rank={!story.is_pinned ? offset + i + 1 : undefined} />
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          {page > 1 && (
            <Link href={`/?sort=${sort}&category=${category}&type=${type}&page=${page - 1}`}
              className="btn-secondary">← Prev</Link>
          )}
          <span className="text-sm text-gray-400 mx-auto">Page {page}</span>
          {sorted.length === pageSize && (
            <Link href={`/?sort=${sort}&category=${category}&type=${type}&page=${page + 1}`}
              className="btn-secondary">Next →</Link>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6 hidden lg:block">
        {/* Submit CTA */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">📝 Got news?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Submit a headline, paste a link, or break a story before the big outlets. Top submitters earn Alpha Reporter status.
          </p>
          <Link href="/submit" className="btn-primary w-full text-center block">Submit a Story</Link>
        </div>

        {/* Trending Narratives */}
        {narratives && narratives.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">🧵 Trending Narratives</h3>
            <ul className="space-y-2">
              {narratives.map(n => (
                <li key={n.id}>
                  <Link href={`/narratives/${n.slug}`}
                    className="flex items-center justify-between hover:text-brand-500 transition-colors group">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-brand-500 truncate">
                      {n.title}
                    </span>
                    <span className="text-xs text-gray-400 ml-2 shrink-0">{n.story_count}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/narratives" className="text-xs text-brand-500 hover:underline mt-3 block">
              View all narratives →
            </Link>
          </div>
        )}

        {/* About box */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">⛓ About CryptoVibes</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The only crypto aggregator with a <strong>Credibility Score</strong> on every story, 
            <strong> Narrative Threading</strong> for ongoing topics, and a 
            <strong> Misinformation Graveyard</strong> for stories proven false.
            Community-powered. Truth-scored.
          </p>
          <div className="flex gap-2 mt-3">
            <a href="https://x.com/cryptovibesapp" target="_blank" rel="noopener noreferrer"
              className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-sky-500 transition-colors">
              𝕏 @cryptovibesapp
            </a>
            <a href="https://bsky.app/profile/cryptovibes.bsky.social" target="_blank" rel="noopener noreferrer"
              className="badge bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:text-blue-700 transition-colors">
              🦋 Bluesky
            </a>
          </div>
        </div>

        {/* Pro upsell */}
        <div className="card p-5 bg-gradient-to-br from-brand-50 to-orange-50 dark:from-brand-900/20 dark:to-orange-900/20 border-brand-200 dark:border-brand-800">
          <h3 className="font-bold text-brand-700 dark:text-brand-300 mb-1">⭐ Go Pro — $7/mo</h3>
          <ul className="text-xs text-brand-600 dark:text-brand-400 space-y-1 mb-3">
            <li>✓ Ad-free experience</li>
            <li>✓ Early Alpha feed access</li>
            <li>✓ API access for your tools</li>
            <li>✓ Pro badge on profile</li>
          </ul>
          <Link href="/pro" className="btn-primary w-full text-center block text-sm">Upgrade Now</Link>
        </div>
      </aside>
    </div>
  )
}
