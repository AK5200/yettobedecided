import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgSlug = searchParams.get('org_slug')
  const returnUrl = searchParams.get('return_url') || ''

  if (!orgSlug) {
    return NextResponse.json({ error: 'org_slug is required' }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

  if (!clientId) {
    return NextResponse.json({ error: 'Google client not configured' }, { status: 500 })
  }

  const state = Buffer.from(JSON.stringify({ org_slug: orgSlug, return_url: returnUrl, provider: 'google' })).toString('base64')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/widget/callback`,
    response_type: 'code',
    scope: 'email profile',
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
