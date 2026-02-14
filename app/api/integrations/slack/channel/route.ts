import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { org_id, channel_id, channel_name } = body

  if (!org_id || !channel_id) {
    return NextResponse.json({ error: 'org_id and channel_id required' }, { status: 400 })
  }

  // Verify user is member of org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Update channel
  const { error } = await supabase
    .from('integrations')
    .update({ channel_id, channel_name })
    .eq('org_id', org_id)
    .eq('type', 'slack')

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
