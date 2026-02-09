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

  // Get board IDs for this org
  let boardQuery = supabase.from('boards').select('id').eq('org_id', orgId)
  if (boardId) {
    boardQuery = boardQuery.eq('id', boardId)
  }
  const { data: boards } = await boardQuery
  const boardIds = boards?.map((b) => b.id) || []

  if (boardIds.length === 0) {
    return NextResponse.json({
      totals: { posts: 0, votes: 0, comments: 0, users: 0 },
      period: { days, posts: 0, posts_prev: 0 },
      by_status: {},
    })
  }

  // Current period posts
  let currentQuery = supabase
    .from('posts')
    .select('id, status, vote_count, board_id')
    .in('board_id', boardIds)
    .gte('created_at', periodStart.toISOString())

  const { data: currentPosts } = await currentQuery

  // Previous period posts
  let prevQuery = supabase
    .from('posts')
    .select('id')
    .in('board_id', boardIds)
    .gte('created_at', prevPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString())

  const { data: prevPosts } = await prevQuery

  // Total posts (all time)
  let totalPostsQuery = supabase.from('posts').select('*', { count: 'exact', head: true }).in('board_id', boardIds)
  const { count: totalPosts } = await totalPostsQuery

  // Total votes - sum vote_count from posts
  let voteQuery = supabase.from('posts').select('vote_count').in('board_id', boardIds)
  const { data: voteData } = await voteQuery
  const totalVotes = voteData?.reduce((sum, p) => sum + (p.vote_count || 0), 0) || 0

  // Total comments - get post IDs first, then count comments
  const { data: allPosts } = await supabase.from('posts').select('id').in('board_id', boardIds)
  const postIds = allPosts?.map((p) => p.id) || []
  
  let totalComments = 0
  if (postIds.length > 0) {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .in('post_id', postIds)
    totalComments = count || 0
  }

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
      comments: totalComments,
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
