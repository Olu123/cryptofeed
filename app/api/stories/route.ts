import { createAdminClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { extractDomain } from '@/lib/utils'

const StorySchema = z.object({
  title: z.string().min(5).max(200),
  url: z.string().url(),
  summary: z.string().max(500).optional(),
  category: z.string().optional(),
  news_type: z.string().optional(),
  narrative_id: z.string().uuid().optional().nullable(),
  has_holding_disclosure: z.boolean().optional(),
  disclosed_token: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    // Auth check via Bearer token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = StorySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { title, url, summary, category, news_type, narrative_id, has_holding_disclosure, disclosed_token } = parsed.data

    // Duplicate check
    const { data: existing } = await supabase.from('stories').select('id').eq('url', url).single()
    if (existing) return NextResponse.json({ error: 'URL already submitted' }, { status: 409 })

    const { data, error } = await supabase.from('stories').insert({
      title, url, summary, category: category ?? 'other',
      news_type: news_type ?? 'fundamental',
      narrative_id: narrative_id ?? null,
      has_holding_disclosure: has_holding_disclosure ?? false,
      disclosed_token: disclosed_token ?? null,
      domain: extractDomain(url),
      submitted_by: user.id,
      status: 'pending',
    }).select('id, title, status').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') ?? 'hot'
  const category = searchParams.get('category')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = createAdminClient()
  let query = supabase
    .from('stories')
    .select(`id, title, url, domain, summary, category, news_type, credibility_score, upvotes, downvotes, comment_count, hot_score, published_at,
      source:sources(name, domain, credibility_score),
      profile:profiles!submitted_by(username, display_name, twitter_handle, bluesky_handle)`)
    .eq('status', 'approved')

  if (category) query = query.eq('category', category)
  if (sort === 'hot') query = query.order('hot_score', { ascending: false })
  else if (sort === 'new') query = query.order('published_at', { ascending: false })
  else query = query.order('upvotes', { ascending: false })

  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, meta: { sort, limit, offset } })
}
