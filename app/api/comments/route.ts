import { createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CommentSchema = z.object({
  story_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  parent_id: z.string().uuid().optional().nullable(),
})

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = CommentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Rate limit: max 10 comments per hour
  const { count } = await supabase.from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString())
  if ((count ?? 0) >= 10) return NextResponse.json({ error: 'Rate limit: 10 comments/hour' }, { status: 429 })

  const { data, error } = await supabase.from('comments')
    .insert({ ...parsed.data, user_id: user.id })
    .select('id, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
