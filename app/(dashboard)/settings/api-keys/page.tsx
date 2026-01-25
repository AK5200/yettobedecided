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
    .single()

  const orgId = membership?.org_id

  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, expires_at, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">API Keys</h1>
      <ApiKeysManager orgId={orgId} initialApiKeys={apiKeys || []} />
    </div>
  )
}
