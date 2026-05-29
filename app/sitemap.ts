import { MetadataRoute } from 'next'

const appUrl = 'https://cryptovibes.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
}
