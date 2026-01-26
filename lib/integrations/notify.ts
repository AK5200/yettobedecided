import { createClient } from '@/lib/supabase/server'

type NotificationType = 'new_feedback' | 'status_change' | 'new_comment'

interface NotificationPayload {
  title: string
  description: string
  url: string
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
      if (i.type === 'slack') {
        await fetch(i.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `*${payload.title}*\n${payload.description}\n<${payload.url}|View>`,
          }),
        })
      } else if (i.type === 'discord') {
        await fetch(i.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: payload.title,
              description: payload.description,
              url: payload.url,
            }],
          }),
        })
      }
    } catch (err) {
      console.error('Integration notify failed:', err)
    }
  }
}
