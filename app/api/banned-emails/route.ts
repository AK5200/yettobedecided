import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('banned_emails')
    .select('*')
    .eq('org_id', orgId)
    .order('banned_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ banned_emails: data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { org_id, email, reason } = body

  if (!org_id || !email) {
    return NextResponse.json({ error: 'org_id and email are required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already banned
  const { data: existing } = await supabase
    .from('banned_emails')
    .select('id')
    .eq('org_id', org_id)
    .ilike('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Email is already banned' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('banned_emails')
    .insert({
      org_id,
      email: email.toLowerCase(),
      reason,
      banned_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ banned_email: data })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const email = searchParams.get('email')

  if (!orgId || !email) {
    return NextResponse.json({ error: 'org_id and email are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('banned_emails')
    .delete()
    .eq('org_id', orgId)
    .ilike('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
