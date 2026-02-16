import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgSettingsForm } from '@/components/settings/org-settings-form'
import { Building2 } from 'lucide-react'

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
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Building2 className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization</h1>
            <p className="text-sm text-gray-500">
              Manage your organization&apos;s profile and settings.
            </p>
          </div>
        </div>
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
    </div>
  )
}
