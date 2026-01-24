import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: memberships, error: memberError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    const orgIds = memberships.map(m => m.org_id)

    if (orgIds.length === 0) {
      return NextResponse.json({ organizations: [] })
    }

    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .in('id', orgIds)

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    return NextResponse.json({ organizations })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
