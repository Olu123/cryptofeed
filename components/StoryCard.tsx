import Link from 'next/link'
import { timeAgo, formatKarma, blueskyUrl, twitterUrl } from '@/lib/utils'
import { newsTypeColor, categoryEmoji } from '@/lib/scoring'
import CredibilityBadge from './CredibilityBadge'
import VoteButton from './VoteButton'
import type { Story } from '@/lib/types'

interface Props {
  story: Story
  rank?: number
  compact?: boolean
}

export default function StoryCard({ story, rank, compact = false }: Props) {
  const title = story.original_language !== 'en' && story.translated_title
    ? story.translated_title
    : story.title

  return (
    <article className={`flex gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group ${compact ? '' : 'border-b border-gray-100 dark:border-gray-800/60'}`}>
      {/* Rank */}
      {rank !== undefined && (
        <div className="text-xl font-bold text-gray-200 dark:text-gray-700 w-8 shrink-0 text-center pt-1">
          {rank}
        </div>
      )}

      {/* Vote */}
      <div className="shrink-0">
        <VoteButton
          storyId={story.id}
          upvotes={story.upvotes}
          downvotes={story.downvotes}
          userVote={story.user_vote}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {story.is_pinned && (
            <span className="badge bg-brand-100 text-brand-700">📌 Pinned</span>
          )}
          {story.is_sponsored && (
            <span className="badge bg-yellow-100 text-yellow-700">Sponsored</span>
          )}
          <span className={`badge ${newsTypeColor(story.news_type)}`}>
            {story.news_type.charAt(0).toUpperCase() + story.news_type.slice(1)}
          </span>
          <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {categoryEmoji(story.category)} {story.category}
          </span>
          {story.original_language !== 'en' && (
            <span className="badge bg-indigo-100 text-indigo-700">
              🌍 Translated from {story.original_language.toUpperCase()}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          <Link href={`/story/${story.id}`} className="hover:underline">
            {title}
          </Link>
          {' '}
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-brand-500 transition-colors font-normal font-mono"
          >
            ({story.domain ?? story.url}) ↗
          </a>
        </h2>

        {/* Summary */}
        {!compact && story.summary && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {story.summary}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
          {/* Source */}
          {story.source && (
            <span className="flex items-center gap-1">
              <CredibilityBadge score={story.source.credibility_score} showLabel={false} />
              <span className="font-medium text-gray-600 dark:text-gray-300">{story.source.name}</span>
            </span>
          )}

          {/* Submitter */}
          {story.profile && (
            <span className="flex items-center gap-1">
              submitted by{' '}
              <Link href={`/profile/${story.profile.username}`}
                className="font-medium text-gray-600 dark:text-gray-300 hover:text-brand-500 transition-colors">
                {story.profile.display_name || story.profile.username}
              </Link>
              {story.profile.alpha_count > 0 && (
                <span title={`Alpha Reporter: broke ${story.profile.alpha_count} stories first`}
                  className="badge bg-purple-100 text-purple-700">
                  ⚡ Alpha
                </span>
              )}
              {/* Social handles */}
              {story.profile.twitter_handle && (
                <a href={twitterUrl(story.profile.twitter_handle)} target="_blank" rel="noopener noreferrer"
                  className="hover:text-sky-500 transition-colors" title={`@${story.profile.twitter_handle} on X`}>𝕏</a>
              )}
              {story.profile.bluesky_handle && (
                <a href={blueskyUrl(story.profile.bluesky_handle)} target="_blank" rel="noopener noreferrer"
                  className="hover:text-blue-500 transition-colors" title={`${story.profile.bluesky_handle} on Bluesky`}>🦋</a>
              )}
            </span>
          )}

          {/* Holding disclosure */}
          {story.has_holding_disclosure && story.disclosed_token && (
            <span className="badge bg-amber-100 text-amber-700" title="Submitter holds this token">
              💼 Holds {story.disclosed_token}
            </span>
          )}

          {/* Time */}
          <span>{timeAgo(story.published_at)}</span>

          {/* Narrative */}
          {story.narrative && (
            <Link href={`/narratives/${story.narrative.slug}`}
              className="badge bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors">
              🧵 {story.narrative.title}
            </Link>
          )}

          {/* Comments */}
          <Link href={`/story/${story.id}#comments`}
            className="hover:text-brand-500 transition-colors">
            💬 {story.comment_count} {story.comment_count === 1 ? 'comment' : 'comments'}
          </Link>

          {/* Story credibility */}
          <CredibilityBadge score={story.credibility_score} />
        </div>
      </div>
    </article>
  )
}
