import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId } = context

    const body = await request.json()
    const { org_id, auto_sync_enabled } = body

    if (typeof auto_sync_enabled !== 'boolean') {
      return NextResponse.json({ error: 'auto_sync_enabled must be a boolean' }, { status: 400 })
    }

    const resolvedOrgId = org_id || orgId

    if (resolvedOrgId !== orgId) {
      return NextResponse.json({ error: 'Not authorized for this organization' }, { status: 403 })
    }

    // Update Linear integration settings
    const { error: updateError } = await supabase
      .from('linear_integrations')
      .update({ auto_sync_enabled })
      .eq('org_id', resolvedOrgId)

    if (updateError) {
      console.error('Failed to update Linear settings:', updateError)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Linear settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
