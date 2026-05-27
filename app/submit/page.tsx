'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { extractDomain } from '@/lib/utils'
import type { Narrative } from '@/lib/types'

const CATEGORIES = ['bitcoin','ethereum','defi','nft','regulation','exchange','layer2','solana','altcoin','security','macro','adoption','other']
const NEWS_TYPES = ['alpha','fundamental','technical','regulatory','social','fud','noise']
const TOKENS = ['BTC','ETH','SOL','BNB','XRP','ADA','AVAX','MATIC','DOT','LINK','UNI','AAVE','OP','ARB','other']

export default function SubmitPage() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('other')
  const [newsType, setNewsType] = useState('fundamental')
  const [narrativeId, setNarrativeId] = useState('')
  const [hasDisclosure, setHasDisclosure] = useState(false)
  const [disclosedToken, setDisclosedToken] = useState('')
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('narratives').select('id, title, slug, category, story_count, follower_count, is_active, created_at, description, cover_image_url')
      .eq('is_active', true).order('story_count', { ascending: false }).limit(50)
      .then(({ data }) => setNarratives(data ?? []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    if (!url.trim() || !title.trim()) {
      setError('URL and title are required.')
      setLoading(false)
      return
    }

    const domain = extractDomain(url)

    // Check if this URL already exists
    const { data: existing } = await supabase.from('stories').select('id').eq('url', url).single()
    if (existing) {
      setError('This story has already been submitted.')
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase.from('stories').insert({
      url: url.trim(),
      title: title.trim(),
      summary: summary.trim() || null,
      domain,
      category,
      news_type: newsType,
      narrative_id: narrativeId || null,
      has_holding_disclosure: hasDisclosure,
      disclosed_token: hasDisclosure ? disclosedToken : null,
      submitted_by: user.id,
      status: 'pending',
    }).select('id').single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/story/${data.id}?submitted=1`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submit a Story</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Share a link, break news, or surface a story others haven't found yet.
          Top submitters earn <strong className="text-purple-600">Alpha Reporter</strong> status.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* URL */}
        <div>
          <label className="label">Story URL *</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://..." className="input" required />
          {url && <p className="text-xs text-gray-400 mt-1">Domain: {extractDomain(url)}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="label">Headline *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Write a clear, accurate headline" className="input" required maxLength={200} />
          <p className="text-xs text-gray-400 mt-1">{title.length}/200</p>
        </div>

        {/* Summary */}
        <div>
          <label className="label">Summary <span className="text-gray-400 font-normal">(optional but recommended)</span></label>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3}
            placeholder="Brief summary of why this matters…" className="input resize-none" maxLength={500} />
        </div>

        {/* Category + Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input capitalize">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">News Type</label>
            <select value={newsType} onChange={e => setNewsType(e.target.value)} className="input">
              {NEWS_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
        </div>

        {/* Narrative */}
        <div>
          <label className="label">Link to Narrative <span className="text-gray-400 font-normal">(optional)</span></label>
          <select value={narrativeId} onChange={e => setNarrativeId(e.target.value)} className="input">
            <option value="">— Not part of a narrative —</option>
            {narratives.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Narratives thread related stories together over time.</p>
        </div>

        {/* Skin-in-the-game disclosure */}
        <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50 dark:bg-amber-900/10">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hasDisclosure} onChange={e => setHasDisclosure(e.target.checked)}
              className="rounded border-amber-400 text-amber-500" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              💼 Skin-in-the-game disclosure — I hold a related token
            </span>
          </label>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-6">
            CryptoFeed requires disclosure if you hold a token you're posting about. This increases your credibility, not decreases it.
          </p>
          {hasDisclosure && (
            <div className="mt-3 ml-6">
              <label className="label text-amber-700 dark:text-amber-300">Which token?</label>
              <select value={disclosedToken} onChange={e => setDisclosedToken(e.target.value)} className="input max-w-xs">
                <option value="">Select token</option>
                {TOKENS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Submitting…' : '🚀 Submit Story'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Stories are reviewed before going live. Spam, FUD, and duplicate submissions will be rejected.
          Read our <a href="/guidelines" className="text-brand-500 hover:underline">submission guidelines</a>.
        </p>
      </form>
    </div>
  )
}
