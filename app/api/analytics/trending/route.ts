import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const period = searchParams.get('period') || 'week' // week, month, all
  const limit = parseInt(searchParams.get('limit') || '10')
  const boardId = searchParams.get('board_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select(
      `
      id, title, vote_count, status, created_at,
      boards(name)
    `
    )
    .eq('org_id', orgId)
    .eq('is_approved', true)
    .order('vote_count', { ascending: false })
    .limit(limit)

  if (boardId) {
    query = query.eq('board_id', boardId)
  }

  // Period filter
  if (period !== 'all') {
    const days = period === 'week' ? 7 : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    query = query.gte('created_at', startDate.toISOString())
  }

  const { data: posts, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate velocity (votes per day since creation)
  const enriched = posts?.map((post: any) => {
    const daysOld = Math.max(
      1,
      Math.floor((Date.now() - new Date(post.created_at).getTime()) / (24 * 60 * 60 * 1000))
    )
    return {
      ...post,
      board_name: post.boards?.name,
      velocity: Math.round((post.vote_count / daysOld) * 10) / 10,
    }
  })

  return NextResponse.json({ posts: enriched || [] })
}
