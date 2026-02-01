import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Default statuses that are created when org has no custom statuses
const DEFAULT_STATUSES = [
  { key: 'open', name: 'Open', color: '#6B7280', order: 0, is_system: true, show_on_roadmap: true },
  { key: 'planned', name: 'Planned', color: '#3B82F6', order: 1, is_system: true, show_on_roadmap: true },
  { key: 'in_progress', name: 'In Progress', color: '#F59E0B', order: 2, is_system: true, show_on_roadmap: true },
  { key: 'shipped', name: 'Shipped', color: '#10B981', order: 3, is_system: true, show_on_roadmap: true },
  { key: 'closed', name: 'Closed', color: '#EF4444', order: 4, is_system: true, show_on_roadmap: false },
]

export async function GET() {
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
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Try to get existing statuses
    const { data: statuses, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('org_id', membership.org_id)
      .order('order', { ascending: true })

    if (error) {
      // Table might not exist, return defaults
      console.error('Error fetching statuses:', error)
      return NextResponse.json({
        statuses: DEFAULT_STATUSES.map((s, i) => ({ ...s, id: `default-${i}`, org_id: membership.org_id }))
      })
    }

    // If no statuses exist, initialize with defaults
    if (!statuses || statuses.length === 0) {
      const statusesToInsert = DEFAULT_STATUSES.map((s) => ({
        ...s,
        org_id: membership.org_id,
      }))

      const { data: insertedStatuses, error: insertError } = await supabase
        .from('statuses')
        .insert(statusesToInsert)
        .select()

      if (insertError) {
        // If insert fails, return defaults without persisting
        return NextResponse.json({
          statuses: DEFAULT_STATUSES.map((s, i) => ({ ...s, id: `default-${i}`, org_id: membership.org_id }))
        })
      }

      return NextResponse.json({ statuses: insertedStatuses })
    }

    return NextResponse.json({ statuses })
  } catch (error) {
    console.error('Error in GET /api/statuses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { name, color, show_on_roadmap } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate a key from the name
    const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

    // Check if key already exists
    const { data: existing } = await supabase
      .from('statuses')
      .select('id')
      .eq('org_id', membership.org_id)
      .eq('key', key)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'A status with this name already exists' }, { status: 400 })
    }

    // Get the max order
    const { data: maxOrderResult } = await supabase
      .from('statuses')
      .select('order')
      .eq('org_id', membership.org_id)
      .order('order', { ascending: false })
      .limit(1)
      .single()

    const newOrder = (maxOrderResult?.order ?? -1) + 1

    const { data: status, error } = await supabase
      .from('statuses')
      .insert({
        org_id: membership.org_id,
        key,
        name: name.trim(),
        color: color || '#6B7280',
        order: newOrder,
        is_system: false,
        show_on_roadmap: show_on_roadmap ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error('Error in POST /api/statuses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
