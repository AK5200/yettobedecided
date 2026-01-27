import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WidgetSettingsForm } from '@/components/dashboard/widget-settings-form'
import { WidgetCodeGenerator } from '@/components/dashboard/widget-code-generator'
import { WidgetPreviewWrapper } from '@/components/dashboard/widget-preview-wrapper'

const defaultSettings = {
  widget_type: 'floating',
  position: 'bottom-right',
  accent_color: '#000000',
  button_text: 'Feedback',
  show_branding: true,
  theme: 'light',
}

export default async function WidgetsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(id, name, slug, plan)')
    .eq('user_id', user!.id)
    .single()

  const org = membership?.organizations as any
  const orgId = membership?.org_id as string

  const { data: settings } = await supabase
    .from('widget_settings')
    .select('*')
    .eq('org_id', orgId)
    .single()

  const { data: boards } = await supabase
    .from('boards')
    .select('id,name')
    .eq('org_id', orgId)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Widgets</h1>
      <Card>
        <CardHeader>
          <CardTitle>Widget Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <WidgetPreviewWrapper orgId={orgId} orgSlug={org?.slug || ''} initialSettings={settings || defaultSettings} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Embed Code</CardTitle>
        </CardHeader>
        <CardContent>
          <WidgetCodeGenerator orgSlug={org?.slug || ''} baseUrl={baseUrl} />
        </CardContent>
      </Card>
    </div>
  )
}
