import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    const { data: boards, error } = await supabase
      .from('boards')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ boards })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId } = context

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)

    // Check if slug is unique within org
    const { data: existing } = await supabase
      .from('boards')
      .select('id')
      .eq('org_id', orgId)
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Board name already exists in this organization' }, { status: 400 })
    }

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({
        org_id: orgId,
        name,
        slug,
        description: description || null
      })
      .select()
      .single()

    if (boardError) {
      return NextResponse.json({ error: boardError.message }, { status: 500 })
    }

    return NextResponse.json({ board }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
