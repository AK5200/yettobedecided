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

  // Get boards for this org
  let boardQuery = supabase.from('boards').select('id, name').eq('org_id', orgId)
  if (boardId) {
    boardQuery = boardQuery.eq('id', boardId)
  }
  const { data: boards } = await boardQuery
  const boardIds = boards?.map((b: any) => b.id) || []
  const boardMap = new Map((boards || []).map((b: any) => [b.id, b.name]))

  if (boardIds.length === 0) {
    return NextResponse.json({ posts: [] })
  }

  let query = supabase
    .from('posts')
    .select('*')
    .in('board_id', boardIds)
    .order('created_at', { ascending: false })
    .limit(limit * 3)

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

  // Posts table doesn't have comment_count column, so count from comments table
  const postIds = (posts || []).map((p: any) => p.id)
  const commentCountMap = new Map<string, number>()
  if (postIds.length > 0) {
    const { data: commentCounts } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)
    if (commentCounts) {
      for (const c of commentCounts) {
        commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1)
      }
    }
  }

  // Filter out posts with no engagement, calculate velocity, sort by engagement
  const enriched = (posts || [])
    .map((post: any) => {
      const commentCount = commentCountMap.get(post.id) || 0
      const daysOld = Math.max(
        1,
        Math.floor((Date.now() - new Date(post.created_at).getTime()) / (24 * 60 * 60 * 1000))
      )
      const engagement = (post.vote_count || 0) + commentCount
      const boardName = boardMap.get(post.board_id) || 'Board'
      return {
        ...post,
        board_name: boardName,
        comment_count: commentCount,
        engagement,
        velocity: Math.round((engagement / daysOld) * 10) / 10,
      }
    })
    .filter((post: any) => post.engagement > 0)
    .sort((a: any, b: any) => {
      if (b.engagement !== a.engagement) return b.engagement - a.engagement
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .slice(0, limit)

  return NextResponse.json({ posts: enriched })
}
