import Link from 'next/link'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Go Pro — CryptoFeed' }

const features = [
  { icon: '🚫', label: 'Ad-free experience', free: false, pro: true },
  { icon: '⚡', label: 'Early Alpha feed access', free: false, pro: true },
  { icon: '🔌', label: 'Read API access', free: false, pro: true },
  { icon: '⭐', label: 'Pro badge on profile', free: false, pro: true },
  { icon: '📰', label: 'Submit stories', free: true, pro: true },
  { icon: '💬', label: 'Comment & vote', free: true, pro: true },
  { icon: '🧵', label: 'Follow narratives', free: true, pro: true },
  { icon: '🔮', label: 'Make predictions', free: true, pro: true },
]

export default function ProPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <span className="text-5xl">⭐</span>
        <h1 className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">CryptoFeed Pro</h1>
        <p className="text-gray-500 mt-2">Support independent crypto journalism. Get the edge.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Free */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-700 dark:text-gray-300 mb-1">Free</h2>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$0</p>
          <ul className="space-y-2">
            {features.map(f => (
              <li key={f.label} className={`flex items-center gap-2 text-sm ${f.free ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>
                <span>{f.free ? '✓' : '—'}</span> {f.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="card p-6 border-brand-300 dark:border-brand-700 bg-gradient-to-br from-brand-50 to-orange-50 dark:from-brand-900/20 dark:to-orange-900/10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-brand-700 dark:text-brand-300">Pro</h2>
            <span className="badge bg-brand-500 text-white text-xs">Most popular</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$7<span className="text-base font-normal text-gray-500">/mo</span></p>
          <ul className="space-y-2">
            {features.map(f => (
              <li key={f.label} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span> {f.label}
              </li>
            ))}
          </ul>
          <Link href="/api/stripe/checkout" className="btn-primary w-full text-center block mt-5">
            Upgrade Now →
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Cancel anytime. Billed monthly via Stripe. Supporting independent crypto journalism.
      </p>
    </div>
  )
}
