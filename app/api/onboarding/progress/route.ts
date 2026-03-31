import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function GET() {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)

    if (!context) {
      return NextResponse.json({ onboarding_step: 0, onboarding_completed: false })
    }
    const { orgId } = context

    const { data: org } = await supabase
      .from('organizations')
      .select('onboarding_step, onboarding_completed, slug')
      .eq('id', orgId)
      .single()

    return NextResponse.json({
      org_id: orgId,
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
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId } = context

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
      .eq('id', orgId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
