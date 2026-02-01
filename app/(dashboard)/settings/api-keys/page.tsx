import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiKeysManager } from '@/components/settings/api-keys-manager'

export default async function ApiKeysSettingsPage() {
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

  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, expires_at, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">API Keys</h1>
      <p className="text-gray-500 mb-8">
        Create and manage API keys for programmatic access to your feedback hub.
      </p>
      <ApiKeysManager orgId={orgId} initialApiKeys={apiKeys || []} />
    </div>
  )
}
