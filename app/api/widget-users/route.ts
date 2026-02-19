import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const sort = searchParams.get('sort') || 'post_count' // post_count, vote_count, comment_count
  const limit = parseInt(searchParams.get('limit') || '10')

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

  // Validate sort field
  const validSorts = ['post_count', 'vote_count', 'comment_count']
  const sortField = validSorts.includes(sort) ? sort : 'post_count'

  const { data: users, error } = await supabase
    .from('widget_users')
    .select('id, email, name, avatar_url, post_count, vote_count, comment_count, company_name')
    .eq('org_id', orgId)
    .order(sortField, { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: users || [] })
}
