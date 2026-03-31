import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const context = await getCurrentOrg(supabase)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { orgId, role } = context

  const body = await request.json()
  const { org_id } = body

  const resolvedOrgId = org_id || orgId

  if (resolvedOrgId !== orgId || !['owner', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Delete integration
  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('org_id', resolvedOrgId)
    .eq('type', 'slack')

  if (error) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
