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
    .select('org_id, role, organizations(id, name, slug, description, website, logo_url, plan, created_at)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  const org = membership?.organizations as any

  return (
    <OrgSettingsForm
      orgId={org?.id}
      userRole={membership?.role || 'admin'}
      initialValues={{
        name: org?.name || '',
        slug: org?.slug || '',
        description: org?.description || '',
        website: org?.website || '',
        logoUrl: org?.logo_url || '',
        plan: org?.plan || 'free',
        createdAt: org?.created_at || '',
      }}
    />
  )
}
