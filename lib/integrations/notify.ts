import { createAdminClient } from '@/lib/supabase/server'

type NotificationType = 'new_feedback' | 'status_change' | 'new_comment'

interface NotificationPayload {
  title: string
  description: string
  url: string
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function truncate(text: string, max: number): string {
  if (!text || text.length <= max) return text || ''
  return text.slice(0, max).trimEnd() + '...'
}

function formatSlackBlocks(payload: NotificationPayload) {
  const descLine = payload.description
    ? `\n>${truncate(payload.description, 150).replace(/\n/g, '\n>')}`
    : ''
  const fallback = `*${payload.title}*${descLine}`

  return {
    text: fallback,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: fallback,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View in Kelo' },
            url: payload.url,
          },
        ],
      },
    ],
  }
}

function formatBody(integrationType: string, payload: NotificationPayload): object {
  switch (integrationType) {
    case 'slack':
      return {
        text: `*${payload.title}*\n${payload.description}\n<${payload.url}|View>`,
      }

    case 'discord':
      return {
        embeds: [
          {
            title: payload.title,
            description: payload.description,
            url: payload.url,
            color: 0x6366f1,
          },
        ],
      }

    case 'teams':
      return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '6366f1',
        summary: payload.title,
        sections: [
          {
            activityTitle: payload.title,
            text: payload.description,
            markdown: true,
          },
        ],
        potentialAction: [
          {
            '@type': 'OpenUri',
            name: 'View in Kelo',
            targets: [{ os: 'default', uri: payload.url }],
          },
        ],
      }

    case 'telegram':
      return {
        text: `<b>${escapeHtml(payload.title)}</b>\n${escapeHtml(payload.description)}\n\n<a href="${payload.url}">View in Kelo</a>`,
        parse_mode: 'HTML',
      }

    case 'webhook':
      return {
        event: payload.title,
        timestamp: new Date().toISOString(),
        data: {
          title: payload.title,
          description: payload.description,
          url: payload.url,
        },
      }

    default:
      return { text: `${payload.title}\n${payload.description}\n${payload.url}` }
  }
}

async function sendSlackOAuth(accessToken: string, channelId: string, payload: NotificationPayload) {
  const message = formatSlackBlocks(payload)
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: channelId,
      ...message,
    }),
  })

  const result = await response.json()
  if (!result.ok) {
    // Auto-join channel if bot is not a member, then retry
    if (result.error === 'not_in_channel') {
      console.error(`[notify] Bot not in channel ${channelId}, attempting to join`)
      const joinRes = await fetch('https://slack.com/api/conversations.join', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel: channelId }),
      })
      const joinResult = await joinRes.json()
      if (joinResult.ok) {
        // Retry sending the message
        const retryRes = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ channel: channelId, ...message }),
        })
        const retryResult = await retryRes.json()
        if (!retryResult.ok) {
          console.error('Slack API error after join:', retryResult.error)
        }
      } else {
        console.error('Slack join channel failed:', joinResult.error)
      }
    } else {
      console.error('Slack API error:', result.error)
    }
  }
}

export async function notifyIntegrations({
  orgId,
  type,
  payload,
}: {
  orgId: string
  type: NotificationType
  payload: NotificationPayload
}) {
  const supabase = createAdminClient()
  const { data: integrations, error: fetchError } = await supabase
    .from('integrations')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)

  if (!integrations || integrations.length === 0) return

  for (const i of integrations) {
    if (type === 'new_feedback' && !i.notify_on_new_feedback) continue
    if (type === 'status_change' && !i.notify_on_status_change) continue
    if (type === 'new_comment' && !i.notify_on_new_comment) continue

    try {
      // Slack OAuth: use API with token + channel_id
      if (i.type === 'slack' && i.access_token && i.channel_id) {
        await sendSlackOAuth(i.access_token, i.channel_id, payload)
        continue
      }

      // Fallback: webhook URL (all types including legacy Slack)
      if (!i.webhook_url) {
        continue
      }

      await fetch(i.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatBody(i.type, payload)),
      })
    } catch (err) {
      console.error(`Integration notify failed (${i.type}):`, err)
    }
  }
}
