import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const orgId = params.id

        // Check membership
        const { data: membership } = await supabase
            .from('org_members')
            .select('role')
            .eq('org_id', orgId)
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { data: org, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 })
        }

        return NextResponse.json({ organization: org })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const orgId = params.id

        // Check admin/owner role
        const { data: membership } = await supabase
            .from('org_members')
            .select('role')
            .eq('org_id', orgId)
            .eq('user_id', user.id)
            .single()

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const { name, slug, description, website, logo_url } = body

        const updates: any = { updated_at: new Date().toISOString() }
        if (name) updates.name = name
        if (slug) updates.slug = slug
        if (description !== undefined) updates.description = description
        if (website !== undefined) updates.website = website
        if (logo_url !== undefined) updates.logo_url = logo_url

        const { data: org, error } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', orgId)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ organization: org })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
