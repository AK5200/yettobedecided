import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WidgetSettingsForm } from '@/components/dashboard/widget-settings-form'

const defaultSettings = {
  widget_type: 'all-in-one',
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
          <WidgetSettingsForm orgId={orgId} initialSettings={settings || defaultSettings} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Embed Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Script Tag</p>
            <pre className="text-xs bg-gray-50 p-3 rounded border">
              {`<script src="${baseUrl}/widget.js" data-org="${org?.slug}"></script>`}
            </pre>
            <button className="mt-2 text-sm underline">Copy</button>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">iFrame</p>
            <pre className="text-xs bg-gray-50 p-3 rounded border">
              {`<iframe src="${baseUrl}/embed/widget?org=${org?.slug}" width="420" height="640"></iframe>`}
            </pre>
            <button className="mt-2 text-sm underline">Copy</button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">
            This is how your widget will appear on your website
          </p>
          <div className="border rounded overflow-hidden">
            <iframe
              src={`/embed/widget?org=${org?.slug}`}
              className="w-full h-[500px]"
              title="Widget preview"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
