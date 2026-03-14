import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getRequesterRole(orgId: string, userId: string) {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()
  return data?.role as string | null
}

// PATCH — change a member's role (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { org_id, role } = await request.json()
    if (!org_id || !role) {
      return NextResponse.json({ error: 'org_id and role are required' }, { status: 400 })
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Only owner can change roles
    const requesterRole = await getRequesterRole(org_id, user.id)
    if (requesterRole !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can change roles' }, { status: 403 })
    }

    // Cannot change owner's role
    const targetRole = await getRequesterRole(org_id, params.userId)
    if (targetRole === 'owner') {
      return NextResponse.json({ error: 'Cannot change the owner\'s role' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('org_members')
      .update({ role })
      .eq('org_id', org_id)
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = request.nextUrl.searchParams.get('org_id')
    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    // Only owner can remove members
    const requesterRole = await getRequesterRole(orgId, user.id)
    if (requesterRole !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can remove members' }, { status: 403 })
    }

    // Cannot remove yourself (owner)
    if (params.userId === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 403 })
    }

    // Cannot remove another owner
    const targetRole = await getRequesterRole(orgId, params.userId)
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
