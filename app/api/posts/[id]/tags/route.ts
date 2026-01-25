import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('post_tags')
    .select('tag_id, tags(*)')
    .eq('post_id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tags: data?.map((pt) => pt.tags) || [] })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { tag_id } = body
  const supabase = await createClient()
  const { error } = await supabase.from('post_tags').insert({ post_id: params.id, tag_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url)
  const tagId = searchParams.get('tag_id')
  const supabase = await createClient()
  const { error } = await supabase.from('post_tags').delete().eq('post_id', params.id).eq('tag_id', tagId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
