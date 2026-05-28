import { createServerSupabaseClient } from '@/lib/supabase-server'
import StoryCard from '@/components/StoryCard'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Regulation Radar — CryptoFeed' }

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', status: 'complex', color: 'bg-yellow-100 text-yellow-700' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺', status: 'regulated', color: 'bg-blue-100 text-blue-700' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', status: 'evolving', color: 'bg-yellow-100 text-yellow-700' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', status: 'friendly', color: 'bg-green-100 text-green-700' },
  { code: 'AE', name: 'UAE / Dubai', flag: '🇦🇪', status: 'friendly', color: 'bg-green-100 text-green-700' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', status: 'regulated', color: 'bg-blue-100 text-blue-700' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', status: 'regulated', color: 'bg-blue-100 text-blue-700' },
  { code: 'CN', name: 'China', flag: '🇨🇳', status: 'banned', color: 'bg-red-100 text-red-700' },
  { code: 'IN', name: 'India', flag: '🇮🇳', status: 'taxed', color: 'bg-orange-100 text-orange-700' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', status: 'evolving', color: 'bg-yellow-100 text-yellow-700' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', status: 'regulated', color: 'bg-blue-100 text-blue-700' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', status: 'friendly', color: 'bg-green-100 text-green-700' },
]

export default async function RegulationPage() {
  const supabase = createServerSupabaseClient()
  const { data: stories } = await supabase
    .from('stories')
    .select(`*, profile:profiles!submitted_by(username, display_name, avatar_url, karma, alpha_count, twitter_handle, bluesky_handle), source:sources(name, domain, logo_url, credibility_score)`)
    .eq('status', 'approved')
    .eq('category', 'regulation')
    .order('published_at', { ascending: false })
    .limit(20)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">⚖️ Regulation Radar</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Live global map of crypto regulatory status. Community-maintained. Click a country for its news.
        </p>
      </div>

      {/* Global status grid */}
      <div className="card p-5 mb-6">
        <h2 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm">Global Status at a Glance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {COUNTRIES.map(c => (
            <div key={c.code} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xl">{c.flag}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.name}</p>
                <span className={`badge ${c.color} text-xs`}>{c.status}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          {[
            { label: 'friendly', color: 'bg-green-100 text-green-700' },
            { label: 'regulated', color: 'bg-blue-100 text-blue-700' },
            { label: 'evolving', color: 'bg-yellow-100 text-yellow-700' },
            { label: 'taxed', color: 'bg-orange-100 text-orange-700' },
            { label: 'banned', color: 'bg-red-100 text-red-700' },
          ].map(s => <span key={s.label} className={`badge ${s.color} text-xs`}>{s.label}</span>)}
          <span className="text-xs text-gray-400 ml-1">Community-maintained. Last updated by moderators.</span>
        </div>
      </div>

      {/* Regulation news */}
      <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">Latest Regulation News</h2>
      {(stories ?? []).length > 0 ? (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden">
          {stories!.map(s => <StoryCard key={s.id} story={s as any} />)}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-3xl mb-2">⚖️</p>
          <p>No regulation news yet. Submit one!</p>
        </div>
      )}
    </div>
  )
}
