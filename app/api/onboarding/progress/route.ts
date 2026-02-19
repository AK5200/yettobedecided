import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      return NextResponse.json({ onboarding_step: 0, onboarding_completed: false })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('onboarding_step, onboarding_completed, slug')
      .eq('id', membership.org_id)
      .single()

    return NextResponse.json({
      org_id: membership.org_id,
      onboarding_step: org?.onboarding_step ?? 0,
      onboarding_completed: org?.onboarding_completed ?? false,
      org_slug: org?.slug ?? null,
    })
  } catch (error) {
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

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const body = await request.json()
    const { step, completed } = body

    const updates: Record<string, unknown> = {}
    if (typeof step === 'number') {
      updates.onboarding_step = step
    }
    if (typeof completed === 'boolean') {
      updates.onboarding_completed = completed
    }

    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', membership.org_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
