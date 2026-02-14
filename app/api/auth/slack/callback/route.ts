import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  return `${protocol}://${host}`
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle user denied
  if (error) {
    return NextResponse.redirect(new URL('/settings/integrations?error=slack_denied', request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings/integrations?error=invalid_request', request.url))
  }

  // Decode state to get org_id
  let orgId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
    orgId = decoded.org_id
  } catch {
    return NextResponse.redirect(new URL('/settings/integrations?error=invalid_state', request.url))
  }

  // Verify user is still authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: `${getBaseUrl(request)}/api/auth/slack/callback`,
    }),
  })

  const tokenData = await tokenResponse.json()

  if (!tokenData.ok) {
    console.error('Slack OAuth error:', tokenData.error)
    return NextResponse.redirect(new URL('/settings/integrations?error=slack_oauth_failed', request.url))
  }

  // Extract data from response
  const {
    access_token,
    team: { id: team_id, name: team_name },
    bot_user_id,
    incoming_webhook,
  } = tokenData

  // Default channel from webhook (if available)
  const channel_id = incoming_webhook?.channel_id || null
  const channel_name = incoming_webhook?.channel || null

  // Upsert integration
  const { error: upsertError } = await supabase
    .from('integrations')
    .upsert({
      org_id: orgId,
      type: 'slack',
      access_token,
      team_id,
      team_name,
      channel_id,
      channel_name,
      bot_user_id,
      installed_by: user.id,
      installed_at: new Date().toISOString(),
      notify_on_new_feedback: true,
      notify_on_status_change: true,
      notify_on_new_comment: true,
      is_active: true,
    }, {
      onConflict: 'org_id,type',
    })

  if (upsertError) {
    console.error('Failed to save Slack integration:', upsertError)
    return NextResponse.redirect(new URL('/settings/integrations?error=save_failed', request.url))
  }

  return NextResponse.redirect(new URL('/settings/integrations?success=slack_connected', request.url))
}
