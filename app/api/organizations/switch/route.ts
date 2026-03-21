import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ORG_COOKIE_NAME } from '@/lib/org-constants'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId } = await request.json()

    if (!orgId || typeof orgId !== 'string') {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
    }

    // Verify user is a member of this org
    const { data: membership, error: memberError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .maybeSingle()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(ORG_COOKIE_NAME, orgId, {
      path: '/',
      httpOnly: false, // needs to be readable by client JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
