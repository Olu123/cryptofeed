'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('magic')
  const router = useRouter()
  const supabase = createClient()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
    if (error) { setError(error.message) } else { setMagicSent(true) }
    setLoading(false)
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message) } else { router.push('/'); router.refresh() }
    setLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'twitter' | 'github') => {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/auth/callback` } })
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="card p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">⛓</span>
          <h1 className="text-xl font-bold mt-2 text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to CryptoFeed</p>
        </div>

        {/* OAuth */}
        <div className="flex flex-col gap-2 mb-5">
          <button onClick={() => handleOAuth('google')}
            className="btn-secondary flex items-center justify-center gap-2 w-full">
            <span>🔑</span> Continue with Google
          </button>
          <button onClick={() => handleOAuth('twitter')}
            className="btn-secondary flex items-center justify-center gap-2 w-full">
            <span>𝕏</span> Continue with X / Twitter
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <hr className="flex-1 border-gray-200 dark:border-gray-700" />
          <span className="text-xs text-gray-400">or</span>
          <hr className="flex-1 border-gray-200 dark:border-gray-700" />
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('magic')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'magic' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
            Magic Link
          </button>
          <button onClick={() => setMode('password')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'password' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
            Password
          </button>
        </div>

        {magicSent ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
            <p className="text-2xl mb-2">📬</p>
            <p className="font-semibold text-green-700 dark:text-green-400">Check your email</p>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">We sent a magic link to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={mode === 'magic' ? handleMagicLink : handlePassword} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="input" required />
            </div>
            {mode === 'password' && (
              <div>
                <label className="label">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="input" required />
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Loading…' : mode === 'magic' ? '📬 Send Magic Link' : 'Sign In'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          No account? <Link href="/auth/signup" className="text-brand-500 hover:underline font-medium">Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
