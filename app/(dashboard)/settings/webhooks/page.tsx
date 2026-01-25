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
    .single()

  const orgId = membership?.org_id

  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Webhooks</h1>
      <WebhooksManager orgId={orgId} initialWebhooks={webhooks || []} availableEvents={AVAILABLE_EVENTS} />
    </div>
  )
}
