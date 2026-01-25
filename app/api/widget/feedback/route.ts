import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { org_slug, board_id, title, content, author_email, author_name } = body

  if (!org_slug || !board_id || !title) {
    return NextResponse.json(
      { error: 'org_slug, board_id, and title are required' },
      { status: 400, headers: corsHeaders }
    )
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', org_slug)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404, headers: corsHeaders })
  }

  const { error } = await supabase.from('posts').insert({
    board_id,
    title,
    content: content || null,
    author_email: author_email || null,
    author_name: author_name || null,
    is_approved: false,
    status: 'open',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }

  return NextResponse.json({ success: true }, { headers: corsHeaders })
}
