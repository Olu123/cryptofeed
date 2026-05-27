import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { categoryEmoji } from '@/lib/scoring'

export const metadata = { title: 'Narratives — Story Threads' }

export default async function NarrativesPage() {
  const supabase = createServerSupabaseClient()
  const { data: narratives } = await supabase
    .from('narratives')
    .select('*')
    .eq('is_active', true)
    .order('story_count', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🧵 Narrative Threads</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Narratives stitch individual stories into ongoing timelines. 
          Understand not just what happened, but how it evolved.
        </p>
      </div>

      {(!narratives || narratives.length === 0) ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-2">🧵</p>
          <p>No narratives yet. Submit a story and link it to a narrative to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {narratives.map(n => (
            <Link key={n.id} href={`/narratives/${n.slug}`}
              className="card p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-colors group">
              {n.cover_image_url && (
                <img src={n.cover_image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs mb-2">
                    {categoryEmoji(n.category)} {n.category}
                  </span>
                  <h2 className="font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors mt-1">
                    {n.title}
                  </h2>
                  {n.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{n.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span>📰 {n.story_count} stories</span>
                <span>👥 {n.follower_count} following</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
