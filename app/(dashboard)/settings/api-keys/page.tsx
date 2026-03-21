import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiKeysManager } from '@/components/settings/api-keys-manager'
import { getCurrentOrg } from '@/lib/org-context'

export default async function ApiKeysSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgContext = await getCurrentOrg(supabase)
  if (!orgContext) {
    redirect('/onboarding')
  }

  const orgId = orgContext.orgId

  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, expires_at, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-kelo-border dark:border-white/10 bg-kelo-surface dark:bg-white/5 text-xs font-mono font-semibold text-kelo-muted dark:text-white/40 tracking-widest uppercase">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
          API Keys
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-kelo-ink dark:text-white tracking-tight leading-tight mb-2">
          API keys
        </h1>
        <p className="text-base text-kelo-muted dark:text-white/50">
          Create and manage API keys for programmatic access to your feedback hub.
        </p>
      </div>
      <ApiKeysManager orgId={orgId} initialApiKeys={apiKeys || []} />
    </div>
  )
}
