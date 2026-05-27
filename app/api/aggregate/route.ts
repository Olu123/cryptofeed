import { createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.AGGREGATE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: feeds } = await supabase
    .from('rss_feeds')
    .select('*, source:sources(id, name, credibility_score, language)')
    .eq('is_active', true)

  let inserted = 0
  const errors: string[] = []

  for (const feed of feeds ?? []) {
    try {
      const res = await fetch(feed.feed_url, {
        headers: { 'User-Agent': 'CryptoFeed/1.0 (+https://cryptofeed.app)' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const xml = await res.text()

      // Simple XML title+link extraction (no dependency needed at runtime)
      const items = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)]
      for (const item of items.slice(0, 20)) {
        const itemContent = item[1]
        const title = itemContent.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim()
        const link = itemContent.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1]?.trim()
            || itemContent.match(/<link[^>]*href="([^"]+)"/i)?.[1]?.trim()
        const pubDate = itemContent.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)?.[1]?.trim()
        const description = itemContent.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim()

        if (!title || !link) continue
        if (title.length < 5 || link.length < 10) continue

        const cleanTitle = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'").trim()
        const cleanSummary = description?.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').substring(0, 400)
        const domain = (() => { try { return new URL(link).hostname.replace('www.', '') } catch { return '' } })()

        // Auto-categorize based on title keywords
        const lc = cleanTitle.toLowerCase()
        const category =
          lc.includes('bitcoin') || lc.includes(' btc') ? 'bitcoin' :
          lc.includes('ethereum') || lc.includes(' eth') ? 'ethereum' :
          lc.includes('defi') || lc.includes('uniswap') || lc.includes('aave') ? 'defi' :
          lc.includes('nft') ? 'nft' :
          lc.includes('regulat') || lc.includes('sec ') || lc.includes('cftc') || lc.includes('law') ? 'regulation' :
          lc.includes('solana') || lc.includes(' sol ') ? 'solana' :
          lc.includes('layer 2') || lc.includes('l2') || lc.includes('optimism') || lc.includes('arbitrum') ? 'layer2' :
          lc.includes('hack') || lc.includes('exploit') || lc.includes('vulnerab') ? 'security' :
          lc.includes('exchange') || lc.includes('binance') || lc.includes('coinbase') ? 'exchange' :
          'other'

        const { error: insertError } = await supabase.from('stories').insert({
          title: cleanTitle,
          url: link,
          domain,
          summary: cleanSummary || null,
          category,
          news_type: 'fundamental',
          status: 'approved',
          source_id: feed.source?.id ?? null,
          credibility_score: feed.source?.credibility_score ?? 50,
          is_auto_aggregated: true,
          original_language: feed.source?.language ?? 'en',
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        })

        if (!insertError) inserted++
      }

      await supabase.from('rss_feeds').update({
        last_fetched: new Date().toISOString(),
        fetch_count: (feed.fetch_count ?? 0) + 1,
      }).eq('id', feed.id)
    } catch (e: any) {
      errors.push(`${feed.feed_url}: ${e.message}`)
      await supabase.from('rss_feeds').update({ error_count: (feed.error_count ?? 0) + 1 }).eq('id', feed.id)
    }
  }

  return NextResponse.json({ inserted, errors, feeds_processed: (feeds ?? []).length })
}
