import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const days = parseInt(searchParams.get('days') || '30')

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

  const { data: boards } = await supabase
    .from('boards')
    .select('id, name')
    .eq('org_id', orgId)

  if (!boards?.length) {
    return NextResponse.json({ boards: [] })
  }

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const boardIds = boards.map((b) => b.id)

  const { data: posts } = await supabase
    .from('posts')
    .select('board_id')
    .in('board_id', boardIds)
    .gte('created_at', startDate.toISOString())

  const countMap = new Map<string, number>()
  posts?.forEach((p) => {
    countMap.set(p.board_id, (countMap.get(p.board_id) || 0) + 1)
  })

  const colors = ['#6366f1', '#F5C518', '#22c55e', '#3b82f6', '#ef4444', '#ec4899', '#8b5cf6', '#f97316']

  const result = boards
    .map((b, i) => ({
      name: b.name,
      posts: countMap.get(b.id) || 0,
      color: colors[i % colors.length],
    }))
    .sort((a, b) => b.posts - a.posts)

  return NextResponse.json({ boards: result })
}
