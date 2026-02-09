import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const period = searchParams.get('period') || 'week'
  const limit = parseInt(searchParams.get('limit') || '10')
  const boardId = searchParams.get('board_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Get board IDs for this org
  let boardQuery = supabase.from('boards').select('id').eq('org_id', orgId)
  if (boardId) {
    boardQuery = boardQuery.eq('id', boardId)
  }
  const { data: boards } = await boardQuery
  const boardIds = boards?.map((b) => b.id) || []

  if (boardIds.length === 0) {
    return NextResponse.json({ posts: [] })
  }

  let query = supabase
    .from('posts')
    .select(
      `
      id, title, vote_count, comment_count, status, created_at, board_id,
      boards(name)
    `
    )
    .in('board_id', boardIds)
    .eq('is_approved', true)
    .order('vote_count', { ascending: false })
    .limit(limit)

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
    const boardName = Array.isArray(post.boards) ? post.boards[0]?.name : post.boards?.name
    return {
      ...post,
      board_name: boardName,
      velocity: Math.round((post.vote_count / daysOld) * 10) / 10,
    }
  })

  return NextResponse.json({ posts: enriched })
}
