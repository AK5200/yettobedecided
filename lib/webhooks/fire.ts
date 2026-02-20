import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export type WebhookEvent = 
  | 'post.created'
  | 'post.status_changed'
  | 'post.voted'
  | 'comment.created'
  | 'changelog.published'

export async function fireWebhooks({
  orgId,
  event,
  payload,
}: {
  orgId: string
  event: WebhookEvent
  payload: any
}) {
  try {
    const supabase = createAdminClient()
    
    // Fetch all active webhooks for the org
    const { data: allWebhooks } = await supabase
      .from('webhooks')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
    
    // Filter webhooks that have this event in their events array
    const webhooks = allWebhooks?.filter(webhook => 
      webhook.events && Array.isArray(webhook.events) && webhook.events.includes(event)
    ) || []
    
    if (!webhooks || webhooks.length === 0) return
    
    const body = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    })
    
    // Fire all webhooks concurrently and await — fire-and-forget drops on serverless
    const sends = webhooks.map((webhook) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(body)
          .digest('hex')
        headers['X-Webhook-Signature'] = signature
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

      return fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      })
        .then((res) => {
          clearTimeout(timeout)
          if (!res.ok) console.error(`Webhook ${webhook.url} returned ${res.status}`)
        })
        .catch((err) => {
          clearTimeout(timeout)
          console.error(`Webhook ${webhook.url} failed:`, err.message)
        })
    })

    await Promise.allSettled(sends)
  } catch (error) {
    console.error('fireWebhooks error:', error)
  }
}
