import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

async function getTargetRole(orgId: string, userId: string) {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  return data?.role as string | null
}

// PATCH — change a member's role (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { org_id, role } = await request.json()
    if (!role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 })
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const orgId = org_id || context.orgId

    // Only owner can change roles
    if (context.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can change roles' }, { status: 403 })
    }

    // Cannot change owner's role
    const targetRole = await getTargetRole(orgId, params.userId)
    if (targetRole === 'owner') {
      return NextResponse.json({ error: 'Cannot change the owner\'s role' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('org_members')
      .update({ role })
      .eq('org_id', orgId)
      .eq('user_id', params.userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE — remove a member (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = request.nextUrl.searchParams.get('org_id') || context.orgId

    // Only owner can remove members
    if (context.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can remove members' }, { status: 403 })
    }

    // Cannot remove yourself (owner)
    const { data: { user } } = await supabase.auth.getUser()
    if (params.userId === user?.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 403 })
    }

    // Cannot remove another owner
    const targetRole = await getTargetRole(orgId, params.userId)
    if (targetRole === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('org_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', params.userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
