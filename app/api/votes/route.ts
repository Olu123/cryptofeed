import { createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { story_id, vote } = await request.json()
  if (!story_id || !['up', 'down'].includes(vote)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { data: existing } = await supabase.from('votes')
    .select('id, vote').eq('story_id', story_id).eq('user_id', user.id).single()

  if (existing) {
    if (existing.vote === vote) {
      await supabase.from('votes').delete().eq('id', existing.id)
      return NextResponse.json({ action: 'unvoted' })
    } else {
      await supabase.from('votes').update({ vote }).eq('id', existing.id)
      return NextResponse.json({ action: 'changed', vote })
    }
  } else {
    await supabase.from('votes').insert({ story_id, user_id: user.id, vote })
    return NextResponse.json({ action: 'voted', vote })
  }
}
