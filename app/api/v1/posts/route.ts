import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }
    
    const apiKey = authHeader.replace('Bearer ', '')
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
    
    const supabase = await createClient()
    
    // Find API key and get org
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('org_id')
      .eq('key_hash', keyHash)
      .single()
    
    if (keyError || !keyData) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    
    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash)
    
    // Get org's boards
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id, name, slug')
      .eq('org_id', keyData.org_id)
    
    if (boardsError) {
      return NextResponse.json({ error: boardsError.message }, { status: 500 })
    }
    
    const boardIds = boards?.map(board => board.id) || []
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('board_id')
    const status = searchParams.get('status')
    
    // If no boards exist, return empty posts array
    if (boardIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        org_id: keyData.org_id,
        boards: boards || [],
        posts: []
      })
    }
    
    // Build posts query
    let postsQuery = supabase
      .from('posts')
      .select('*')
      .in('board_id', boardIds)
    
    // Filter by board_id if provided (and it's valid)
    if (boardId && boardIds.includes(boardId)) {
      postsQuery = postsQuery.eq('board_id', boardId)
    }
    
    // Filter by status if provided
    if (status) {
      postsQuery = postsQuery.eq('status', status)
    }
    
    // Order by created_at descending
    const { data: posts, error: postsError } = await postsQuery
      .order('created_at', { ascending: false })
    
    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      org_id: keyData.org_id,
      boards: boards || [],
      posts: posts || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
