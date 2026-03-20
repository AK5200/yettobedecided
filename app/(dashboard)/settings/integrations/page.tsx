import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { IntegrationsManager } from '@/components/settings/integrations-manager'

export default async function IntegrationsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members').select('org_id').eq('user_id', user.id).limit(1).single()

  const orgId = membership?.org_id

  const { data: integrations } = await supabase.from('integrations').select('*').eq('org_id', orgId)

  const { data: linearIntegration } = await supabase
    .from('linear_integrations').select('*').eq('org_id', orgId).maybeSingle()

  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${host}`

  const linearClientId = process.env.LINEAR_CLIENT_ID
  const linearRedirectUri = `${baseUrl}/api/auth/linear/callback`
  const linearAuthUrl = linearClientId
    ? `https://linear.app/oauth/authorize?client_id=${linearClientId}&redirect_uri=${encodeURIComponent(linearRedirectUri)}&response_type=code&scope=read,write`
    : null

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-kelo-border dark:border-white/10 bg-kelo-surface dark:bg-white/5 text-xs font-mono font-semibold text-kelo-muted dark:text-white/40 tracking-widest uppercase">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Integrations
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-kelo-ink dark:text-white tracking-tight leading-tight mb-2">
          Integrations
        </h1>
        <p className="text-base text-kelo-muted dark:text-white/50">
          Connect your favorite tools to receive notifications and sync feedback.
        </p>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-kelo-yellow border-t-transparent animate-spin" />
        </div>
      }>
        <IntegrationsManager
          orgId={orgId}
          initialIntegrations={integrations || []}
          linearIntegration={linearIntegration}
          linearAuthUrl={linearAuthUrl}
        />
      </Suspense>
    </div>
  )
}
