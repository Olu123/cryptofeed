import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { timeAgo, formatDate, blueskyUrl, twitterUrl } from '@/lib/utils'
import { newsTypeColor, categoryEmoji } from '@/lib/scoring'
import CredibilityBadge from '@/components/CredibilityBadge'
import VoteButton from '@/components/VoteButton'
import CommentThread from '@/components/CommentThread'
import CommentBox from './CommentBox'
import type { Story, Comment, Prediction } from '@/lib/types'

export default async function StoryPage({ params, searchParams }: {
  params: { id: string }
  searchParams: { submitted?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: story } = await supabase
    .from('stories')
    .select(`
      *,
      profile:profiles(username, display_name, avatar_url, karma, alpha_count, role, twitter_handle, bluesky_handle),
      source:sources(name, domain, logo_url, credibility_score, twitter_handle, bluesky_handle),
      narrative:narratives(title, slug, description, story_count)
    `)
    .eq('id', params.id)
    .single()

  if (!story) notFound()

  // Increment view count (fire and forget)
  supabase.from('stories').update({ view_count: story.view_count + 1 }).eq('id', story.id)

  // Get user vote
  let userVote = null
  if (user) {
    const { data: vote } = await supabase.from('votes')
      .select('vote').eq('story_id', story.id).eq('user_id', user.id).single()
    userVote = vote?.vote ?? null
  }

  // Comments (top-level, then nested)
  const { data: allComments } = await supabase
    .from('comments')
    .select(`*, profile:profiles(username, display_name, avatar_url, karma, role, twitter_handle, bluesky_handle)`)
    .eq('story_id', story.id)
    .order('created_at', { ascending: true })

  // Build tree
  const commentMap: Record<string, Comment> = {}
  const topLevel: Comment[] = []
  for (const c of allComments ?? []) {
    commentMap[c.id] = { ...c, replies: [] }
  }
  for (const c of Object.values(commentMap)) {
    if (c.parent_id && commentMap[c.parent_id]) {
      commentMap[c.parent_id].replies!.push(c)
    } else {
      topLevel.push(c)
    }
  }

  // Predictions
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`*, profile:profiles(username, display_name, avatar_url, prediction_accuracy)`)
    .eq('story_id', story.id)
    .order('upvotes', { ascending: false })
    .limit(10)

  const title = story.original_language !== 'en' && story.translated_title
    ? story.translated_title : story.title

  return (
    <div className="max-w-4xl mx-auto">
      {searchParams.submitted === '1' && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm">
          ✅ Your story has been submitted and is pending moderation review. You'll see it here once approved.
        </div>
      )}

      <div className="card p-6 mb-6">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`badge ${newsTypeColor(story.news_type)}`}>
            {story.news_type.charAt(0).toUpperCase() + story.news_type.slice(1)}
          </span>
          <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {categoryEmoji(story.category)} {story.category}
          </span>
          {story.status === 'graveyard' && (
            <span className="badge bg-red-100 text-red-700">🪦 Debunked / Graveyard</span>
          )}
          {story.is_sponsored && (
            <span className="badge bg-yellow-100 text-yellow-700">Sponsored</span>
          )}
          {story.original_language !== 'en' && (
            <span className="badge bg-indigo-100 text-indigo-700">
              🌍 Translated from {story.original_language.toUpperCase()}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-2">
          {title}
        </h1>

        {/* Original title if translated */}
        {story.original_language !== 'en' && story.translated_title && (
          <p className="text-sm text-gray-500 italic mb-2">Original: {story.title}</p>
        )}

        {/* External link */}
        <a href={story.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium text-sm mb-4 hover:underline">
          🔗 Read full story on {story.domain ?? story.url} ↗
        </a>

        {/* Summary */}
        {story.summary && (
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-sm border-l-4 border-brand-500 pl-3">
            {story.summary}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-4">
          <div className="flex items-center gap-2">
            <VoteButton storyId={story.id} upvotes={story.upvotes} downvotes={story.downvotes} userVote={userVote} />
          </div>

          {story.profile && (
            <div className="flex items-center gap-2">
              <span>Submitted by</span>
              <Link href={`/profile/${story.profile.username}`}
                className="font-semibold text-gray-800 dark:text-gray-200 hover:text-brand-500">
                {story.profile.display_name || story.profile.username}
              </Link>
              {story.profile.twitter_handle && (
                <a href={twitterUrl(story.profile.twitter_handle)} target="_blank" rel="noopener noreferrer"
                  className="hover:text-sky-500 transition-colors">𝕏</a>
              )}
              {story.profile.bluesky_handle && (
                <a href={blueskyUrl(story.profile.bluesky_handle)} target="_blank" rel="noopener noreferrer"
                  className="hover:text-blue-500 transition-colors">🦋</a>
              )}
              {story.profile.alpha_count > 0 && (
                <span className="badge bg-purple-100 text-purple-700">⚡ Alpha Reporter</span>
              )}
            </div>
          )}

          <span>{formatDate(story.published_at)}</span>
          <span>👁 {story.view_count.toLocaleString()} views</span>
          <CredibilityBadge score={story.credibility_score} size="md" />
        </div>

        {/* Holding disclosure */}
        {story.has_holding_disclosure && story.disclosed_token && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
            💼 <strong>Disclosure:</strong> The submitter holds {story.disclosed_token}. This is a voluntary disclosure in the interest of transparency.
          </div>
        )}

        {/* Source info */}
        {story.source && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center gap-3">
            <div>
              <p className="text-xs text-gray-500">Source</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{story.source.name}</p>
              <div className="flex gap-2 mt-1">
                <CredibilityBadge score={story.source.credibility_score} />
                {story.source.twitter_handle && (
                  <a href={twitterUrl(story.source.twitter_handle)} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-sky-500">𝕏 @{story.source.twitter_handle}</a>
                )}
                {story.source.bluesky_handle && (
                  <a href={blueskyUrl(story.source.bluesky_handle)} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-blue-500">🦋 {story.source.bluesky_handle}</a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Narrative link */}
        {story.narrative && (
          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-xs text-purple-600 font-medium mb-1">🧵 Part of Narrative</p>
            <Link href={`/narratives/${story.narrative.slug}`}
              className="text-sm font-semibold text-purple-700 dark:text-purple-300 hover:underline">
              {story.narrative.title}
            </Link>
            {story.narrative.description && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{story.narrative.description}</p>
            )}
            <p className="text-xs text-purple-500 mt-1">{story.narrative.story_count} stories in this thread →</p>
          </div>
        )}
      </div>

      {/* Predictions */}
      {(predictions ?? []).length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">🔮 Community Predictions</h2>
          <div className="space-y-3">
            {predictions!.map(p => (
              <div key={p.id} className={`p-3 rounded-lg border text-sm ${
                p.outcome === 'correct' ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' :
                p.outcome === 'incorrect' ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' :
                'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}>
                <p className="text-gray-800 dark:text-gray-200">{p.content}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                  <Link href={`/profile/${p.profile?.username}`}
                    className="font-medium hover:text-brand-500">
                    @{p.profile?.username}
                  </Link>
                  {p.resolve_by && <span>resolves {timeAgo(p.resolve_by)}</span>}
                  {p.outcome !== 'pending' && (
                    <span className={`badge ${p.outcome === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.outcome === 'correct' ? '✓ Correct' : '✗ Wrong'}
                    </span>
                  )}
                  <span>▲ {p.upvotes}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/predictions" className="text-xs text-brand-500 hover:underline mt-3 block">
            View all predictions →
          </Link>
        </div>
      )}

      {/* Comments */}
      <div className="card p-6" id="comments">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">
          💬 Comments ({story.comment_count})
        </h2>

        {user && <CommentBox storyId={story.id} />}
        {!user && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-500 text-center">
            <Link href="/auth/login" className="text-brand-500 hover:underline font-medium">Sign in</Link> to join the discussion
          </div>
        )}

        {topLevel.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No comments yet. Be first.</p>
        ) : (
          <CommentThread comments={topLevel} storyId={story.id} />
        )}
      </div>
    </div>
  )
}
