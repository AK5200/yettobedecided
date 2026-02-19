import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.from('tags').select('*').eq('org_id', orgId).order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tags: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { org_id, name, color } = body
  if (!org_id || !name) return NextResponse.json({ error: 'org_id and name required' }, { status: 400 })

  // Verify user is admin/owner of org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('tags')
    .insert({ org_id, name, color: color || '#6B7280' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tag: data })
}
