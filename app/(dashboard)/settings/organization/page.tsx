import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgSettingsForm } from '@/components/settings/org-settings-form'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Zap, CheckCircle2 } from 'lucide-react'

export default async function OrganizationSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(id, name, slug, description, website, logo_url)')
    .eq('user_id', user.id)
    .single()

  const org = membership?.organizations as any

  const { data: linearIntegration } = await supabase
    .from('linear_integrations')
    .select('*')
    .eq('org_id', org?.id)
    .single()

  const linearClientId = process.env.NEXT_PUBLIC_LINEAR_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linear/callback`
  const linearAuthUrl = `https://linear.app/oauth/authorize?client_id=${linearClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read,write`

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Organization Settings</h1>
      <OrgSettingsForm
        orgId={org?.id}
        initialValues={{
          name: org?.name || '',
          slug: org?.slug || '',
          description: org?.description || '',
          website: org?.website || '',
          logoUrl: org?.logo_url || '',
        }}
      />

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Integrations</h2>
          <p className="text-sm text-gray-500">Connect FeedbackHub with your other tools.</p>
        </div>

        <div className="flex items-center justify-between p-6 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg">Linear</p>
              <p className="text-sm text-gray-500">Sync feedback with Linear issues.</p>
            </div>
          </div>

          {linearIntegration ? (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Connected to {linearIntegration.team_name || 'Linear'}
            </div>
          ) : (
            <a href={linearAuthUrl}>
              <Button>Connect Linear</Button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
