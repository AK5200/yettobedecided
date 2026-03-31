import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const limit = parseInt(searchParams.get('limit') || '5')
  const boardId = searchParams.get('board_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  const context = await getCurrentOrg(supabase)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (context.orgId !== orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let boardQuery = supabase.from('boards').select('id, name').eq('org_id', orgId)
  if (boardId) {
    boardQuery = boardQuery.eq('id', boardId)
  }
  const { data: boards } = await boardQuery
  const boardIds = boards?.map((b) => b.id) || []
  const boardMap = new Map((boards || []).map((b) => [b.id, b.name]))

  if (boardIds.length === 0) {
    return NextResponse.json({ posts: [] })
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, status, vote_count, priority_category, board_id, created_at')
    .in('board_id', boardIds)
    .order('created_at', { ascending: false })
    .limit(limit)

  const enriched = (posts || []).map((post) => ({
    id: post.id,
    title: post.title,
    board: boardMap.get(post.board_id) || 'Board',
    votes: post.vote_count || 0,
    status: post.status || 'open',
    priority: post.priority_category || 'unscored',
    time: getTimeAgo(post.created_at),
  }))

  return NextResponse.json({ posts: enriched })
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
