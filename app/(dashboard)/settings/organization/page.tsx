import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgSettingsForm } from '@/components/settings/org-settings-form'

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
    .limit(1)
    .single()

  const org = membership?.organizations as any

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization</h1>
      <p className="text-gray-500 mb-8">
        Manage your organization's profile and settings.
      </p>
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
    </div>
  )
}
