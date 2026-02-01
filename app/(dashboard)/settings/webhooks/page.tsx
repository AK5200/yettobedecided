import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WebhooksManager } from '@/components/settings/webhooks-manager'

const AVAILABLE_EVENTS = [
  'post.created',
  'post.status_changed',
  'post.voted',
  'comment.created',
  'changelog.published',
]

export default async function WebhooksSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  const orgId = membership?.org_id

  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Webhooks</h1>
      <p className="text-gray-500 mb-8">
        Send real-time notifications to your server when events happen in your feedback hub.
      </p>
      <WebhooksManager orgId={orgId} initialWebhooks={webhooks || []} availableEvents={AVAILABLE_EVENTS} />
    </div>
  )
}
