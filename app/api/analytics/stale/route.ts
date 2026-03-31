import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')

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

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Get board IDs for this org
  const { data: boards } = await supabase.from('boards').select('id').eq('org_id', orgId)
  const boardIds = boards?.map((b) => b.id) || []

  if (boardIds.length === 0) {
    return NextResponse.json({ posts: [] })
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .in('board_id', boardIds)
    .not('status', 'in', '("shipped","closed")')
    .lt('updated_at', thirtyDaysAgo)
    .lt('created_at', thirtyDaysAgo)
    .order('updated_at', { ascending: true })
    .limit(50)

  const enriched = posts?.map((p) => ({
    ...p,
    days_stale: Math.floor((Date.now() - new Date(p.updated_at).getTime()) / (24 * 60 * 60 * 1000)),
  }))

  return NextResponse.json({ posts: enriched || [] })
}
