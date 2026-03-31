import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { getCurrentOrg } from '@/lib/org-context'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId, role } = context

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'You don\'t have permission to perform this action. Admin role required.' }, { status: 403 })
    }

    // Generate API key
    const rawKey = `fh_${randomBytes(32).toString('hex')}`
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.substring(0, 12) + '...'

    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .insert({
        org_id: orgId,
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
