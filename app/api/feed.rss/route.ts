import { createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data: stories } = await supabase
    .from('stories')
    .select('id, title, url, summary, published_at')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(50)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cryptofeed.app'
  const items = (stories ?? []).map(s => `
    <item>
      <title><![CDATA[${s.title}]]></title>
      <link>${s.url}</link>
      <guid>${appUrl}/story/${s.id}</guid>
      <description><![CDATA[${s.summary ?? ''}]]></description>
      <pubDate>${new Date(s.published_at).toUTCString()}</pubDate>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CryptoFeed</title>
    <link>${appUrl}</link>
    <description>Credible crypto and blockchain news, community-ranked.</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
