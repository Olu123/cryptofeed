import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: { default: 'CryptoVibes — Credible Rundown of Daily Crypto News', template: '%s | CryptoVibes' },
  description: 'The most credible crypto and blockchain news aggregator. User-submitted, community-ranked, truth-scored.',
  keywords: ['crypto news', 'blockchain news', 'bitcoin', 'ethereum', 'defi', 'web3'],
  openGraph: {
    type: 'website',
    title: 'CryptoVibes — Credible Rundown of Daily Crypto News',
    description: 'User-submitted, community-ranked, truth-scored crypto news.',
    images: [{ url: '/og-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CryptoVibes',
    description: 'Credible crypto news, ranked by the community.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-8 text-center text-sm text-gray-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="/about" className="hover:text-brand-500 transition-colors">About</a>
            <a href="/submit" className="hover:text-brand-500 transition-colors">Submit Story</a>
            <a href="/narratives" className="hover:text-brand-500 transition-colors">Narratives</a>
            <a href="/graveyard" className="hover:text-brand-500 transition-colors">Misinformation Graveyard</a>
            <a href="/predictions" className="hover:text-brand-500 transition-colors">Predictions</a>
            <a href="/api/feed.rss" className="hover:text-brand-500 transition-colors">RSS</a>
            <a href="https://x.com/cryptovibesapp" target="_blank" rel="noopener noreferrer" className="hover:text-sky-500 transition-colors">𝕏 Twitter</a>
            <a href="https://bsky.app/profile/cryptovibes.bsky.social" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">🦋 Bluesky</a>
            <a href="/advertise" className="hover:text-brand-500 transition-colors">Advertise</a>
            <a href="/pro" className="hover:text-brand-500 transition-colors">⭐ Go Pro</a>
          </div>
          <p className="mt-4 text-xs text-gray-300 dark:text-gray-600">
            © {new Date().getFullYear()} CryptoVibes. Community-powered. Truth-scored.
          </p>
        </footer>
      </body>
    </html>
  )
}
