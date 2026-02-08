import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const days = parseInt(searchParams.get('days') || '30')
  const boardId = searchParams.get('board_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  const now = new Date()
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const prevPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000)

  // Build base query for current period
  let currentQuery = supabase
    .from('posts')
    .select('id, status, vote_count, board_id')
    .eq('org_id', orgId)
    .gte('created_at', periodStart.toISOString())

  if (boardId) {
    currentQuery = currentQuery.eq('board_id', boardId)
  }

  const { data: currentPosts } = await currentQuery

  // Previous period for comparison
  let prevQuery = supabase
    .from('posts')
    .select('id')
    .eq('org_id', orgId)
    .gte('created_at', prevPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString())

  if (boardId) {
    prevQuery = prevQuery.eq('board_id', boardId)
  }

  const { data: prevPosts } = await prevQuery

  // Total stats (all time)
  let totalPostsQuery = supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if (boardId) {
    totalPostsQuery = totalPostsQuery.eq('board_id', boardId)
  }

  const { count: totalPosts } = await totalPostsQuery

  // Total votes
  let voteQuery = supabase
    .from('posts')
    .select('vote_count')
    .eq('org_id', orgId)

  if (boardId) {
    voteQuery = voteQuery.eq('board_id', boardId)
  }

  const { data: voteData } = await voteQuery
  const totalVotes = voteData?.reduce((sum, p) => sum + (p.vote_count || 0), 0) || 0

  // Total comments
  let commentsQuery = supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const { count: totalComments } = await commentsQuery

  // Total users
  const { count: totalUsers } = await supabase
    .from('widget_users')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  // Posts by status
  const statusCounts: Record<string, number> = {}
  currentPosts?.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
  })

  return NextResponse.json({
    totals: {
      posts: totalPosts || 0,
      votes: totalVotes,
      comments: totalComments || 0,
      users: totalUsers || 0,
    },
    period: {
      days,
      posts: currentPosts?.length || 0,
      posts_prev: prevPosts?.length || 0,
    },
    by_status: statusCounts,
  })
}
