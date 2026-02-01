import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        .eq('org_id', membership.org_id)
    )

    await Promise.all(updatePromises)

    // Fetch updated statuses
    const { data: statuses, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('org_id', membership.org_id)
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
