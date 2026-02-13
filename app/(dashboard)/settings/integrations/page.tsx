import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { IntegrationsManager } from '@/components/settings/integrations-manager'

export default async function IntegrationsSettingsPage() {
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

  const { data: integrations } = await supabase.from('integrations').select('*').eq('org_id', orgId)

  // Fetch Linear integration
  const { data: linearIntegration } = await supabase
    .from('linear_integrations')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle()

  // Build Linear OAuth URL — derive baseUrl from headers (NEXT_PUBLIC_APP_URL unreliable on Vercel)
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
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Integrations</h1>
      <p className="text-gray-500 mb-8">
        Connect your favorite tools to receive notifications and sync feedback.
      </p>
      <IntegrationsManager
        orgId={orgId}
        initialIntegrations={integrations || []}
        linearIntegration={linearIntegration}
        linearAuthUrl={linearAuthUrl}
      />
    </div>
  )
}
