import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const context = await getCurrentOrg(supabase)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { orgId } = context

  const body = await request.json()
  const { org_id, channel_id, channel_name } = body

  if (!channel_id) {
    return NextResponse.json({ error: 'channel_id required' }, { status: 400 })
  }

  const resolvedOrgId = org_id || orgId

  if (resolvedOrgId !== orgId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Update channel
  const { error } = await supabase
    .from('integrations')
    .update({ channel_id, channel_name })
    .eq('org_id', resolvedOrgId)
    .eq('type', 'slack')

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
