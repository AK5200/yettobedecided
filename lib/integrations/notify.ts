import { createClient } from '@/lib/supabase/server'

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
            name: 'View in FeedbackHub',
            targets: [{ os: 'default', uri: payload.url }],
          },
        ],
      }

    case 'telegram':
      return {
        text: `<b>${escapeHtml(payload.title)}</b>\n${escapeHtml(payload.description)}\n\n<a href="${payload.url}">View in FeedbackHub</a>`,
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

export async function notifyIntegrations({
  orgId,
  type,
  payload,
}: {
  orgId: string
  type: NotificationType
  payload: NotificationPayload
}) {
  const supabase = await createClient()
  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)

  if (!integrations) return

  for (const i of integrations) {
    if (type === 'new_feedback' && !i.notify_on_new_feedback) continue
    if (type === 'status_change' && !i.notify_on_status_change) continue
    if (type === 'new_comment' && !i.notify_on_new_comment) continue

    if (!i.webhook_url) continue

    try {
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
