import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StoryCard from '@/components/StoryCard'
import { categoryEmoji } from '@/lib/scoring'

export default async function NarrativePage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: narrative } = await supabase
    .from('narratives').select('*').eq('slug', params.slug).single()
  if (!narrative) notFound()

  const { data: stories } = await supabase
    .from('stories')
    .select(`*, profile:profiles(username, display_name, avatar_url, karma, alpha_count, twitter_handle, bluesky_handle), source:sources(name, domain, logo_url, credibility_score)`)
    .eq('narrative_id', narrative.id)
    .eq('status', 'approved')
    .order('published_at', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6 mb-6">
        {narrative.cover_image_url && (
          <img src={narrative.cover_image_url} alt="" className="w-full h-48 object-cover rounded-xl mb-4" />
        )}
        <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500 mb-2">
          {categoryEmoji(narrative.category)} {narrative.category}
        </span>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{narrative.title}</h1>
        {narrative.description && (
          <p className="text-gray-500 dark:text-gray-400 mt-2">{narrative.description}</p>
        )}
        <div className="flex gap-4 mt-3 text-sm text-gray-400">
          <span>📰 {narrative.story_count} stories</span>
          <span>👥 {narrative.follower_count} following</span>
        </div>
      </div>

      <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
        Timeline of Events
      </h2>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-4">
          {(stories ?? []).map((story, i) => (
            <div key={story.id} className="relative pl-12">
              <div className="absolute left-3.5 top-4 w-3 h-3 rounded-full bg-brand-500 border-2 border-white dark:border-gray-950" />
              <StoryCard story={story as any} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
