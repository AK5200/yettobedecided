import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentOrg } from '@/lib/org-context'
import { OrgSettingsForm } from '@/components/settings/org-settings-form'

export default async function OrganizationSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const orgContext = await getCurrentOrg(supabase)
  if (!orgContext) {
    redirect('/onboarding')
  }

  return (
    <OrgSettingsForm
      orgId={orgContext.org.id}
      userRole={orgContext.role || 'admin'}
      initialValues={{
        name: orgContext.org.name || '',
        slug: orgContext.org.slug || '',
        description: (orgContext.org as any)?.description || '',
        website: (orgContext.org as any)?.website || '',
        logoUrl: orgContext.org.logo_url || '',
        plan: orgContext.org.plan || 'free',
        createdAt: (orgContext.org as any)?.created_at || '',
      }}
    />
  )
}
