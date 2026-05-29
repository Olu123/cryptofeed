import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cryptovibes.vercel.app'

  const { data: stories } = await supabase
    .from('stories')
    .select('id, published_at')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(5000)

  const { data: narratives } = await supabase
    .from('narratives')
    .select('slug, updated_at')
    .eq('is_active', true)

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${appUrl}`,             lastModified: new Date(), changeFrequency: 'hourly',  priority: 1.0 },
    { url: `${appUrl}/about`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${appUrl}/submit`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${appUrl}/narratives`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${appUrl}/predictions`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${appUrl}/graveyard`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${appUrl}/regulation`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${appUrl}/pro`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${appUrl}/advertise`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const storyPages: MetadataRoute.Sitemap = (stories ?? []).map(s => ({
    url: `${appUrl}/story/${s.id}`,
    lastModified: new Date(s.published_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const narrativePages: MetadataRoute.Sitemap = (narratives ?? []).map(n => ({
    url: `${appUrl}/narratives/${n.slug}`,
    lastModified: n.updated_at ? new Date(n.updated_at) : new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  return [...staticPages, ...storyPages, ...narrativePages]
}
