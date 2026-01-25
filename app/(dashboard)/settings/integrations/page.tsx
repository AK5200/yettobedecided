import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
    .single()

  const orgId = membership?.org_id

  const { data: integrations } = await supabase.from('integrations').select('*').eq('org_id', orgId)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <IntegrationsManager orgId={orgId} initialIntegrations={integrations || []} />
    </div>
  )
}
