import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createAdminClient } from '@/lib/supabase/server'
import { upsertWidgetUser } from '@/lib/widget-users'

type OAuthProvider = 'google' | 'github'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
  }

  let decodedState: { org_slug: string; return_url?: string; provider: OAuthProvider; popup?: boolean }
  try {
    decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
  } catch {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  }

  const { org_slug: orgSlug, return_url: returnUrl, provider, popup } = decodedState
  const url = new URL(request.url)
  const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '')
  const host = request.headers.get('host') || url.host
  const baseUrl = `${proto}://${host}`

  try {
    let accessToken = ''
    let profile: { id: string; email: string; name?: string; avatar?: string } | null = null

    if (provider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Google client not configured' }, { status: 500 })
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: `${baseUrl}/api/auth/widget/callback`,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenRes.json()
      accessToken = tokenData.access_token

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const userData = await userRes.json()
      profile = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar: userData.picture,
      }
    }

    if (provider === 'github') {
      const clientId = process.env.GITHUB_CLIENT_ID
      const clientSecret = process.env.GITHUB_CLIENT_SECRET
      if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'GitHub client not configured' }, { status: 500 })
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: `${baseUrl}/api/auth/widget/callback`,
        }),
      })
      const tokenData = await tokenRes.json()
      accessToken = tokenData.access_token

      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const userData = await userRes.json()

      let email = userData.email
      if (!email) {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const emailData = await emailRes.json()
        const primary = emailData.find((entry: any) => entry.primary && entry.verified)
        email = primary?.email
      }

      profile = {
        id: String(userData.id),
        email,
        name: userData.name || userData.login,
        avatar: userData.avatar_url,
      }
    }

    if (!profile?.email) {
      return NextResponse.json({ error: 'Email not available from provider' }, { status: 400 })
    }

    const client = createAdminClient()
    const { data: org } = await client
      .from('organizations')
      .select('id, slug')
      .eq('slug', orgSlug)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const { user, error } = await upsertWidgetUser(org.id, {
      external_id: `${provider}_${profile.id}`,
      email: profile.email,
      name: profile.name,
      avatar_url: profile.avatar,
      user_source: provider === 'google' ? 'social_google' : 'social_github',
    })

    if (error || !user) {
      return NextResponse.json({ error: error || 'Failed to create user' }, { status: 500 })
    }

    if (popup) {
      // Popup mode: send user data back to the widget iframe via postMessage, then close
      const userData = JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      })
      const html = `<!DOCTYPE html><html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'feedbackhub:identity', user: ${userData} }, '*');
        }
        window.close();
      </script></body></html>`
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    const jwtSecret = process.env.WIDGET_JWT_SECRET || process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 })
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    const response = NextResponse.redirect(returnUrl || `${baseUrl}/embed/widget?org=${org.slug}`)
    response.cookies.set('widget_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('OAuth callback failed:', error)
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 })
  }
}
