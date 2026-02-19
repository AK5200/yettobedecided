import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const metric = searchParams.get('metric') || 'posts'
  const days = parseInt(searchParams.get('days') || '30')
  const boardId = searchParams.get('board_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Get board IDs for this org
  let boardQuery = supabase.from('boards').select('id').eq('org_id', orgId)
  if (boardId) {
    boardQuery = boardQuery.eq('id', boardId)
  }
  const { data: boards } = await boardQuery
  const boardIds = boards?.map((b) => b.id) || []

  if (boardIds.length === 0) {
    return NextResponse.json({ series: [] })
  }

  // Get posts grouped by date
  const { data: posts } = await supabase
    .from('posts')
    .select('created_at, vote_count')
    .in('board_id', boardIds)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  // Get comments - get post IDs first, then query comments
  const { data: allPosts } = await supabase.from('posts').select('id').in('board_id', boardIds)
  const postIds = allPosts?.map((p) => p.id) || []
  
  let comments: any[] = []
  if (postIds.length > 0) {
    const { data: commentsData } = await supabase
      .from('comments')
      .select('created_at')
      .in('post_id', postIds)
      .gte('created_at', startDate.toISOString())
    comments = commentsData || []
  }

  // Group by date
  const byDate: Record<string, { date: string; posts: number; votes: number; comments: number }> = {}

  // Initialize all dates
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]
    byDate[key] = { date: key, posts: 0, votes: 0, comments: 0 }
  }

  posts?.forEach((p) => {
    const key = p.created_at.split('T')[0]
    if (byDate[key]) {
      byDate[key].posts++
      byDate[key].votes += p.vote_count || 0
    }
  })

  comments?.forEach((c) => {
    const key = c.created_at.split('T')[0]
    if (byDate[key]) {
      byDate[key].comments++
    }
  })

  const series = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({ series })
}
