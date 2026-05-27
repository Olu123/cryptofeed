'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [blueskyHandle, setBlueskyHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    if (!username.match(/^[a-z0-9_]{3,20}$/)) {
      setError('Username: 3-20 chars, lowercase letters, numbers, underscores only.')
      setLoading(false); return
    }
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (existing) { setError('Username already taken.'); setLoading(false); return }

    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { username, twitter_handle: twitterHandle, bluesky_handle: blueskyHandle },
        emailRedirectTo: `${location.origin}/auth/callback`,
      }
    })
    if (error) { setError(error.message) } else { setDone(true) }
    setLoading(false)
  }

  if (done) return (
    <div className="max-w-md mx-auto mt-8">
      <div className="card p-8 text-center">
        <p className="text-4xl mb-3">🎉</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Check your email</h2>
        <p className="text-sm text-gray-500 mt-2">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
        <Link href="/" className="btn-primary inline-block mt-5">Back to Feed</Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="card p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">⛓</span>
          <h1 className="text-xl font-bold mt-2 text-gray-900 dark:text-white">Join CryptoFeed</h1>
          <p className="text-sm text-gray-500 mt-1">Free forever. Submit stories, earn karma.</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
              placeholder="satoshi_nakamoto" className="input" required minLength={3} maxLength={20} />
            <p className="text-xs text-gray-400 mt-1">Lowercase, 3–20 chars. This is permanent.</p>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" required minLength={8} />
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Social Handles <span className="font-normal normal-case text-gray-400">(optional)</span></p>
            <div>
              <label className="label text-xs">𝕏 X / Twitter</label>
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-sm">@</span>
                <input value={twitterHandle} onChange={e => setTwitterHandle(e.target.value.replace('@',''))}
                  placeholder="yourhandle" className="input flex-1 text-sm" />
              </div>
            </div>
            <div>
              <label className="label text-xs">🦋 Bluesky</label>
              <input value={blueskyHandle} onChange={e => setBlueskyHandle(e.target.value)}
                placeholder="yourhandle.bsky.social" className="input text-sm" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account…' : '🚀 Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account? <Link href="/auth/login" className="text-brand-500 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
