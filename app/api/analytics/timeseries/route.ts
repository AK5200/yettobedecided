import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const metric = searchParams.get('metric') || 'posts' // posts, votes, comments
  const days = parseInt(searchParams.get('days') || '30')
  const boardId = searchParams.get('board_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Get posts grouped by date
  let postsQuery = supabase
    .from('posts')
    .select('created_at, vote_count')
    .eq('org_id', orgId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  if (boardId) {
    postsQuery = postsQuery.eq('board_id', boardId)
  }

  const { data: posts } = await postsQuery

  // Get comments
  const { data: comments } = await supabase
    .from('comments')
    .select('created_at')
    .eq('org_id', orgId)
    .gte('created_at', startDate.toISOString())

  // Group by date
  const byDate: Record<string, { date: string; posts: number; votes: number; comments: number }> =
    {}

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
