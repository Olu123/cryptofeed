import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminPanel from './AdminPanel'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Moderation Panel' }

export default async function AdminPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!profile || (profile.role !== 'moderator' && profile.role !== 'admin')) {
    redirect('/')
  }

  const [{ data: pending }, { data: flagged }, { data: recentLogs }] = await Promise.all([
    supabase.from('stories')
      .select(`*, profile:profiles(username, display_name), source:sources(name, credibility_score)`)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50),
    supabase.from('stories')
      .select(`*, profile:profiles(username, display_name), source:sources(name, credibility_score)`)
      .eq('status', 'approved')
      .gt('flagged_count', 0)
      .order('flagged_count', { ascending: false })
      .limit(20),
    supabase.from('moderation_logs')
      .select(`*, moderator:profiles(username, display_name)`)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return <AdminPanel pending={pending ?? []} flagged={flagged ?? []} recentLogs={recentLogs ?? []} isAdmin={profile.role === 'admin'} />
}
