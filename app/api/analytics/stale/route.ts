import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, vote_count, status, created_at, updated_at')
    .eq('org_id', orgId)
    .eq('is_approved', true)
    .not('status', 'in', '("completed","closed")')
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
