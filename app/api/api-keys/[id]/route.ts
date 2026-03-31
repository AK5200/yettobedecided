import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId, role } = context

    // Get API key to verify org ownership
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('org_id')
      .eq('id', id)
      .single()

    if (apiKeyError || !apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    if (apiKey.org_id !== orgId || (role !== 'admin' && role !== 'owner')) {
      return NextResponse.json({ error: 'You don\'t have permission to perform this action. Admin role required.' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'API key deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
