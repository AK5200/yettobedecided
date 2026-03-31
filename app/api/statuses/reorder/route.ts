import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId, role } = context

    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json({ error: 'You don\'t have permission to perform this action. Admin role required.' }, { status: 403 })
    }

    const body = await request.json()
    const { orderedIds } = body

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds must be an array' }, { status: 400 })
    }

    // Update each status with its new order
    const updatePromises = orderedIds.map((id: string, index: number) =>
      supabase
        .from('statuses')
        .update({ order: index })
        .eq('id', id)
        .eq('org_id', orgId)
    )

    await Promise.all(updatePromises)

    // Fetch updated statuses
    const { data: statuses, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('org_id', orgId)
      .order('order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ statuses })
  } catch (error) {
    console.error('Error in POST /api/statuses/reorder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
