'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

const navLinks = [
  { href: '/', label: 'Feed' },
  { href: '/narratives', label: 'Narratives' },
  { href: '/predictions', label: 'Predictions' },
  { href: '/graveyard', label: '🪦 Graveyard' },
  { href: '/regulation', label: '⚖️ Regulation' },
]

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    })
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <span className="text-brand-500 text-2xl">⛓</span>
          <span className="hidden sm:block text-gray-900 dark:text-white">Crypto<span className="text-brand-500">Feed</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 ml-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs ml-auto hidden sm:block">
          <div className="relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search stories…"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-brand-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none transition"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              🔍
            </button>
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/submit" className="btn-primary hidden sm:flex items-center gap-1">
            <span>+</span> Submit
          </Link>

          {profile ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 transition"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                    {profile.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:block text-gray-700 dark:text-gray-300">
                  {profile.display_name || profile.username}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 card shadow-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">@{profile.username}</p>
                    <p className="text-xs text-brand-500 font-medium">⚡ {profile.karma} karma</p>
                  </div>
                  <Link href={`/profile/${profile.username}`} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    👤 My Profile
                  </Link>
                  <Link href="/submit" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    📝 Submit Story
                  </Link>
                  {(profile.role === 'moderator' || profile.role === 'admin') && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition text-orange-600">
                      🛡 Moderation Panel
                    </Link>
                  )}
                  {!profile.is_pro && (
                    <Link href="/pro" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition text-brand-600 font-medium">
                      ⭐ Upgrade to Pro
                    </Link>
                  )}
                  <hr className="my-1 border-gray-100 dark:border-gray-800" />
                  <button onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition">
                    🚪 Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="btn-ghost hidden sm:block">Login</Link>
              <Link href="/auth/signup" className="btn-primary">Sign Up</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden btn-ghost"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2 flex flex-col gap-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              {link.label}
            </Link>
          ))}
          <Link href="/submit" onClick={() => setMenuOpen(false)}
            className="btn-primary text-center mt-2">
            + Submit Story
          </Link>
        </div>
      )}
    </nav>
  )
}
