import { createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cryptovibes.vercel.app'

  // Fetch all approved stories
  const { data: stories } = await supabase
    .from('stories')
    .select('id, published_at, updated_at')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(5000)

  // Fetch all active narratives
  const { data: narratives } = await supabase
    .from('narratives')
    .select('slug, updated_at')
    .eq('is_active', true)

  // Static pages
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'hourly' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/submit', priority: '0.7', changefreq: 'monthly' },
    { url: '/narratives', priority: '0.8', changefreq: 'daily' },
    { url: '/predictions', priority: '0.7', changefreq: 'daily' },
    { url: '/graveyard', priority: '0.6', changefreq: 'weekly' },
    { url: '/regulation', priority: '0.7', changefreq: 'daily' },
    { url: '/pro', priority: '0.6', changefreq: 'monthly' },
    { url: '/advertise', priority: '0.5', changefreq: 'monthly' },
  ]

  const staticUrls = staticPages.map(p => `
  <url>
    <loc>${appUrl}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const storyUrls = (stories ?? []).map(s => `
  <url>
    <loc>${appUrl}/story/${s.id}</loc>
    <lastmod>${new Date(s.published_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')

  const narrativeUrls = (narratives ?? []).map(n => `
  <url>
    <loc>${appUrl}/narratives/${n.slug}</loc>
    <lastmod>${n.updated_at ? new Date(n.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${storyUrls}
  ${narrativeUrls}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
