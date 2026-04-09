import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orgId } = await params
        const supabase = await createClient()
        const context = await getCurrentOrg(supabase)

        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (context.orgId !== orgId) {
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orgId } = await params
        const supabase = await createClient()
        const context = await getCurrentOrg(supabase)

        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (context.orgId !== orgId || !['owner', 'admin'].includes(context.role)) {
            return NextResponse.json({ error: 'You don\'t have permission to perform this action. Admin role required.' }, { status: 403 })
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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orgId } = await params
        const supabase = await createClient()
        const context = await getCurrentOrg(supabase)

        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (context.orgId !== orgId || context.role !== 'owner') {
            return NextResponse.json({ error: 'Only the organization owner can delete this organization.' }, { status: 403 })
        }

        // Verify confirmation name matches
        const body = await request.json()
        const { confirmName } = body

        const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', orgId)
            .single()

        if (!org || org.name !== confirmName) {
            return NextResponse.json({ error: 'Organization name does not match.' }, { status: 400 })
        }

        // Use admin client to delete (RLS may not have a DELETE policy)
        const adminSupabase = createAdminClient()
        const { error: deleteError } = await adminSupabase
            .from('organizations')
            .delete()
            .eq('id', orgId)

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
