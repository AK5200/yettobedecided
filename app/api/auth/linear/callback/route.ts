import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { LinearClient } from '@linear/sdk'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  // Derive baseUrl from request headers
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${host}`

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/settings/integrations?error=no_code`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`)
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://api.linear.app/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.LINEAR_CLIENT_ID!,
        client_secret: process.env.LINEAR_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/linear/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error)
    }

    const accessToken = tokenData.access_token

    // Get Linear viewer/team info
    const linear = new LinearClient({ accessToken })
    const teams = await linear.teams()
    const firstTeam = teams.nodes[0]

    // Get user's org
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      throw new Error('No organization association found')
    }

    // Store in database
    await supabase.from('linear_integrations').upsert({
      org_id: membership.org_id,
      access_token: accessToken,
      team_id: firstTeam?.id,
      team_name: firstTeam?.name,
      connected_by_id: user.id,
    })

    return NextResponse.redirect(`${baseUrl}/settings/integrations?success=linear_connected`)
  } catch (e: any) {
    console.error('Linear OAuth failed:', e)
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent(e.message)}`
    )
  }
}
