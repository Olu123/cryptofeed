/**
 * CryptoFeed RSS Aggregator
 * Run with: npm run aggregate
 * Or schedule via GitHub Actions / Vercel Cron
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return '' }
}

function autoCategory(title: string): string {
  const lc = title.toLowerCase()
  if (lc.includes('bitcoin') || lc.includes(' btc')) return 'bitcoin'
  if (lc.includes('ethereum') || lc.includes(' eth')) return 'ethereum'
  if (lc.includes('defi') || lc.includes('uniswap') || lc.includes('aave')) return 'defi'
  if (lc.includes('nft')) return 'nft'
  if (lc.includes('regulat') || lc.includes('sec ') || lc.includes('cftc') || lc.includes('legislation')) return 'regulation'
  if (lc.includes('solana') || lc.includes(' sol ')) return 'solana'
  if (lc.includes('layer 2') || lc.includes('arbitrum') || lc.includes('optimism') || lc.includes(' op ')) return 'layer2'
  if (lc.includes('hack') || lc.includes('exploit') || lc.includes('breach') || lc.includes('vulnerab')) return 'security'
  if (lc.includes('exchange') || lc.includes('binance') || lc.includes('coinbase') || lc.includes('kraken')) return 'exchange'
  if (lc.includes('fed ') || lc.includes('inflation') || lc.includes('macro') || lc.includes('interest rate')) return 'macro'
  return 'other'
}

async function fetchFeed(url: string): Promise<Array<{ title: string; link: string; summary?: string; pubDate?: string }>> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CryptoFeed/1.0' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()

  const items = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)]
  return items.slice(0, 25).map(item => {
    const content = item[1]
    const title = content.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() ?? ''
    const link = (content.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1] ?? content.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? '').trim()
    const pubDate = content.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)?.[1]?.trim()
    const description = content.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]
    const summary = description?.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#039;/g, "'").substring(0, 400).trim()
    const cleanTitle = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'").trim()
    return { title: cleanTitle, link, summary, pubDate }
  }).filter(item => item.title && item.link)
}

async function main() {
  console.log('🔗 CryptoFeed RSS Aggregator starting…')
  const { data: feeds } = await supabase
    .from('rss_feeds')
    .select('*, source:sources(id, name, credibility_score, language)')
    .eq('is_active', true)

  let total = 0; let skipped = 0; let errors = 0

  for (const feed of feeds ?? []) {
    try {
      const items = await fetchFeed(feed.feed_url)
      console.log(`  📡 ${feed.source?.name ?? feed.feed_url}: ${items.length} items`)

      for (const item of items) {
        if (!item.title || !item.link) continue

        const { error } = await supabase.from('stories').insert({
          title: item.title,
          url: item.link,
          domain: extractDomain(item.link),
          summary: item.summary ?? null,
          category: autoCategory(item.title),
          news_type: 'fundamental',
          status: 'approved',
          source_id: feed.source?.id ?? null,
          credibility_score: feed.source?.credibility_score ?? 50,
          is_auto_aggregated: true,
          original_language: feed.source?.language ?? 'en',
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        })

        if (!error) total++
        else if (error.code === '23505') skipped++ // duplicate URL
      }

      await supabase.from('rss_feeds').update({
        last_fetched: new Date().toISOString(),
        fetch_count: (feed.fetch_count ?? 0) + 1,
        error_count: 0,
      }).eq('id', feed.id)
    } catch (e: any) {
      console.error(`  ❌ Error for ${feed.feed_url}:`, e.message)
      await supabase.from('rss_feeds').update({ error_count: (feed.error_count ?? 0) + 1 }).eq('id', feed.id)
      errors++
    }
  }

  console.log(`\n✅ Done: ${total} new | ${skipped} dupes | ${errors} feed errors`)
}

main().catch(console.error)
