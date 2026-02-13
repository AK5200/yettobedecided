import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { org_id } = body

  if (!org_id) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  // Verify user belongs to this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', org_id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
  }

  const { error } = await supabase
    .from('linear_integrations')
    .delete()
    .eq('org_id', org_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
