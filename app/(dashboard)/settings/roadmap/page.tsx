'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Map, Eye, EyeOff, Calendar, Crown } from 'lucide-react'

interface RoadmapSettings {
  is_public: boolean
  show_completed: boolean
  show_eta: boolean
  custom_title: string
  custom_description: string
  columns: {
    planned: { label: string; visible: boolean }
    in_progress: { label: string; visible: boolean }
    completed: { label: string; visible: boolean }
  }
}

export default function RoadmapSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<RoadmapSettings>({
    is_public: true,
    show_completed: true,
    show_eta: false,
    custom_title: 'Product Roadmap',
    custom_description: 'See what we\'re working on and what\'s coming next.',
    columns: {
      planned: { label: 'Planned', visible: true },
      in_progress: { label: 'In Progress', visible: true },
      completed: { label: 'Completed', visible: true },
    },
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('organizations(*)')
      .eq('user_id', user.id)
      .single()

    if (membership?.organizations) {
      const org = membership.organizations as any
      if (org.roadmap_settings) {
        setSettings(org.roadmap_settings)
      }
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return

    const { error } = await supabase
      .from('organizations')
      .update({ roadmap_settings: settings })
      .eq('id', membership.org_id)

    if (error) {
      toast.error('Failed to save settings')
    } else {
      toast.success('Roadmap settings saved!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Roadmap</h1>
      <p className="text-gray-500 mb-8">
        Configure how your public roadmap looks and what it displays.
      </p>

      {/* Visibility Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibility</h2>

        <Card className="divide-y">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {settings.is_public ? (
                <Eye className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">Public Roadmap</h3>
                <p className="text-sm text-gray-500">
                  Make your roadmap visible to everyone
                </p>
              </div>
            </div>
            <Switch
              checked={settings.is_public}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, is_public: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-medium text-gray-900">Show Completed Items</h3>
              <p className="text-sm text-gray-500">
                Display completed items on the roadmap
              </p>
            </div>
            <Switch
              checked={settings.show_completed}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_completed: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  Show ETA
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Upgrade
                  </span>
                </h3>
                <p className="text-sm text-gray-500">
                  Display estimated completion dates on roadmap items
                </p>
              </div>
            </div>
            <Switch
              checked={settings.show_eta}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_eta: checked })
              }
              disabled
            />
          </div>
        </Card>
      </section>

      {/* Customization Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customization</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roadmapTitle">Roadmap Title</Label>
            <Input
              id="roadmapTitle"
              value={settings.custom_title}
              onChange={(e) =>
                setSettings({ ...settings, custom_title: e.target.value })
              }
              placeholder="Product Roadmap"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roadmapDescription">Description</Label>
            <Textarea
              id="roadmapDescription"
              value={settings.custom_description}
              onChange={(e) =>
                setSettings({ ...settings, custom_description: e.target.value })
              }
              placeholder="See what we're working on..."
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* Columns Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Roadmap Columns</h2>
        <p className="text-sm text-gray-500 mb-4">
          Customize the labels for each column on your roadmap.
        </p>

        <div className="grid gap-4">
          {/* Planned Column */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div className="flex-1">
                <Input
                  value={settings.columns.planned.label}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      columns: {
                        ...settings.columns,
                        planned: { ...settings.columns.planned, label: e.target.value },
                      },
                    })
                  }
                  placeholder="Planned"
                />
              </div>
              <Switch
                checked={settings.columns.planned.visible}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    columns: {
                      ...settings.columns,
                      planned: { ...settings.columns.planned, visible: checked },
                    },
                  })
                }
              />
            </div>
          </Card>

          {/* In Progress Column */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="flex-1">
                <Input
                  value={settings.columns.in_progress.label}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      columns: {
                        ...settings.columns,
                        in_progress: { ...settings.columns.in_progress, label: e.target.value },
                      },
                    })
                  }
                  placeholder="In Progress"
                />
              </div>
              <Switch
                checked={settings.columns.in_progress.visible}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    columns: {
                      ...settings.columns,
                      in_progress: { ...settings.columns.in_progress, visible: checked },
                    },
                  })
                }
              />
            </div>
          </Card>

          {/* Completed Column */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1">
                <Input
                  value={settings.columns.completed.label}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      columns: {
                        ...settings.columns,
                        completed: { ...settings.columns.completed, label: e.target.value },
                      },
                    })
                  }
                  placeholder="Completed"
                />
              </div>
              <Switch
                checked={settings.columns.completed.visible}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    columns: {
                      ...settings.columns,
                      completed: { ...settings.columns.completed, visible: checked },
                    },
                  })
                }
              />
            </div>
          </Card>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
