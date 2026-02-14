import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const orgId = searchParams.get('org_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  // Get Slack integration
  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token')
    .eq('org_id', orgId)
    .eq('type', 'slack')
    .single()

  if (!integration?.access_token) {
    return NextResponse.json({ error: 'Slack not connected' }, { status: 404 })
  }

  // Fetch channels from Slack in parallel
  const [publicChannels, privateChannels] = await Promise.all([
    fetchSlackChannels(integration.access_token, 'public_channel'),
    fetchSlackChannels(integration.access_token, 'private_channel'),
  ])

  const channels = [
    ...publicChannels.map((c: SlackChannel) => ({ ...c, type: 'public' })),
    ...privateChannels.map((c: SlackChannel) => ({ ...c, type: 'private' })),
  ].sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({ channels })
}

interface SlackChannel {
  id: string
  name: string
  is_private: boolean
}

async function fetchSlackChannels(token: string, types: string): Promise<SlackChannel[]> {
  const response = await fetch(
    `https://slack.com/api/conversations.list?types=${types}&exclude_archived=true&limit=200`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!data.ok) {
    console.error('Slack API error:', data.error)
    return []
  }

  return data.channels.map((c: { id: string; name: string; is_private: boolean }) => ({
    id: c.id,
    name: c.name,
    is_private: c.is_private,
  }))
}
