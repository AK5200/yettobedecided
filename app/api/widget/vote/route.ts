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
  const { post_id, voter_email } = body

  if (!post_id || !voter_email) {
    return NextResponse.json(
      { error: 'post_id and voter_email are required' },
      { status: 400, headers: corsHeaders }
    )
  }

  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('post_id', post_id)
    .eq('voter_email', voter_email)
    .single()

  if (existingVote) {
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('id', existingVote.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500, headers: corsHeaders })
    }

    await supabase.rpc('decrement_vote_count', { post_id_input: post_id })

    return NextResponse.json({ voted: false }, { headers: corsHeaders })
  }

  const { error: insertError } = await supabase.from('votes').insert({
    post_id,
    voter_email,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500, headers: corsHeaders })
  }

  await supabase.rpc('increment_vote_count', { post_id_input: post_id })

  return NextResponse.json({ voted: true }, { headers: corsHeaders })
}
