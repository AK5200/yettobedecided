import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

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
  const context = await getCurrentOrg(supabase)
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { orgId, role } = context

  const body = await request.json()
  const { name, color } = body
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'You don\'t have permission to perform this action. Admin role required.' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('tags')
    .insert({ org_id: orgId, name, color: color || '#6B7280' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tag: data })
}
