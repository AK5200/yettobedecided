import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { org_id, name } = body

    if (!org_id || !name) {
      return NextResponse.json({ error: 'org_id and name are required' }, { status: 400 })
    }

    // Verify user is admin of org
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Generate API key
    const rawKey = `fh_${randomBytes(32).toString('hex')}`
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.substring(0, 12) + '...'

    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .insert({
        org_id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
      })
      .select()
      .single()

    if (apiKeyError) {
      return NextResponse.json({ error: apiKeyError.message }, { status: 500 })
    }

    // Return API key without the hash, but include the raw key for display
    const { key_hash: _, ...apiKeyWithoutHash } = apiKey

    return NextResponse.json({ 
      apiKey: apiKeyWithoutHash,
      rawKey // Only time the full key is returned
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
