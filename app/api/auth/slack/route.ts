import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  return `${protocol}://${host}`
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const searchParams = request.nextUrl.searchParams
  const orgId = searchParams.get('org_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  // Verify user is member of org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const clientId = process.env.SLACK_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Slack not configured' }, { status: 500 })
  }

  const redirectUri = `${getBaseUrl(request)}/api/auth/slack/callback`

  // State contains org_id for callback
  const state = Buffer.from(JSON.stringify({ org_id: orgId })).toString('base64')

  const scopes = ['chat:write', 'channels:read', 'channels:join', 'groups:read'].join(',')

  const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize')
  slackAuthUrl.searchParams.set('client_id', clientId)
  slackAuthUrl.searchParams.set('scope', scopes)
  slackAuthUrl.searchParams.set('redirect_uri', redirectUri)
  slackAuthUrl.searchParams.set('state', state)

  return NextResponse.redirect(slackAuthUrl.toString())
}
