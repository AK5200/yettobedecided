import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WebhooksManager } from '@/components/settings/webhooks-manager'
import { getCurrentOrg } from '@/lib/org-context'

const AVAILABLE_EVENTS = [
  'post.created',
  'post.status_changed',
  'post.voted',
  'comment.created',
  'changelog.published',
]

export default async function WebhooksSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgContext = await getCurrentOrg(supabase)
  if (!orgContext) {
    redirect('/onboarding')
  }

  const orgId = orgContext.orgId

  const { data: webhooks } = await supabase
    .from('webhooks').select('*').eq('org_id', orgId).order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-kelo-border dark:border-white/10 bg-kelo-surface dark:bg-white/5 text-xs font-mono font-semibold text-kelo-muted dark:text-white/40 tracking-widest uppercase">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          Webhooks
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-kelo-ink dark:text-white tracking-tight leading-tight mb-2">
          Webhooks
        </h1>
        <p className="text-base text-kelo-muted dark:text-white/50">
          Send real-time notifications to your server when events happen.
        </p>
        <p className="text-sm text-kelo-muted/70 dark:text-white/30 mt-1">
          Connect to any app via webhooks: n8n, Zapier, Make, Pipedream, custom servers, and more.
        </p>
      </div>
      <WebhooksManager orgId={orgId} initialWebhooks={webhooks || []} availableEvents={AVAILABLE_EVENTS} />
    </div>
  )
}
