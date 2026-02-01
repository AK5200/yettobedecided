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
import { Megaphone, Mail, Bell, Globe, Crown } from 'lucide-react'

interface ChangelogSettings {
  is_public: boolean
  allow_subscriptions: boolean
  send_email_notifications: boolean
  custom_title: string
  custom_description: string
  categories: {
    feature: { label: string; enabled: boolean }
    improvement: { label: string; enabled: boolean }
    fix: { label: string; enabled: boolean }
    announcement: { label: string; enabled: boolean }
  }
}

export default function ChangelogSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<ChangelogSettings>({
    is_public: true,
    allow_subscriptions: true,
    send_email_notifications: false,
    custom_title: 'Changelog',
    custom_description: 'Stay up to date with the latest updates and improvements.',
    categories: {
      feature: { label: 'New Feature', enabled: true },
      improvement: { label: 'Improvement', enabled: true },
      fix: { label: 'Bug Fix', enabled: true },
      announcement: { label: 'Announcement', enabled: true },
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
      if (org.changelog_settings) {
        setSettings(org.changelog_settings)
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
      .update({ changelog_settings: settings })
      .eq('id', membership.org_id)

    if (error) {
      toast.error('Failed to save settings')
    } else {
      toast.success('Changelog settings saved!')
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Changelog</h1>
      <p className="text-gray-500 mb-8">
        Configure your changelog settings and notification preferences.
      </p>

      {/* Visibility Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibility & Access</h2>

        <Card className="divide-y">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900">Public Changelog</h3>
                <p className="text-sm text-gray-500">
                  Make your changelog visible to everyone
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
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900">Allow Subscriptions</h3>
                <p className="text-sm text-gray-500">
                  Let users subscribe to changelog updates
                </p>
              </div>
            </div>
            <Switch
              checked={settings.allow_subscriptions}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allow_subscriptions: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  Email Notifications
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Upgrade
                  </span>
                </h3>
                <p className="text-sm text-gray-500">
                  Automatically email subscribers when you publish updates
                </p>
              </div>
            </div>
            <Switch
              checked={settings.send_email_notifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, send_email_notifications: checked })
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
            <Label htmlFor="changelogTitle">Page Title</Label>
            <Input
              id="changelogTitle"
              value={settings.custom_title}
              onChange={(e) =>
                setSettings({ ...settings, custom_title: e.target.value })
              }
              placeholder="Changelog"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="changelogDescription">Description</Label>
            <Textarea
              id="changelogDescription"
              value={settings.custom_description}
              onChange={(e) =>
                setSettings({ ...settings, custom_description: e.target.value })
              }
              placeholder="Stay up to date with the latest updates..."
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
        <p className="text-sm text-gray-500 mb-4">
          Customize the category labels for your changelog entries.
        </p>

        <div className="grid gap-4">
          {/* Feature */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div className="flex-1">
                <Input
                  value={settings.categories.feature.label}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      categories: {
                        ...settings.categories,
                        feature: { ...settings.categories.feature, label: e.target.value },
                      },
                    })
                  }
                  placeholder="New Feature"
                />
              </div>
              <Switch
                checked={settings.categories.feature.enabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    categories: {
                      ...settings.categories,
                      feature: { ...settings.categories.feature, enabled: checked },
                    },
                  })
                }
              />
            </div>
          </Card>

          {/* Improvement */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div className="flex-1">
                <Input
                  value={settings.categories.improvement.label}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      categories: {
                        ...settings.categories,
                        improvement: { ...settings.categories.improvement, label: e.target.value },
                      },
                    })
                  }
                  placeholder="Improvement"
                />
              </div>
              <Switch
                checked={settings.categories.improvement.enabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    categories: {
                      ...settings.categories,
                      improvement: { ...settings.categories.improvement, enabled: checked },
                    },
                  })
                }
              />
            </div>
          </Card>

          {/* Fix */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <div className="flex-1">
                <Input
                  value={settings.categories.fix.label}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      categories: {
                        ...settings.categories,
                        fix: { ...settings.categories.fix, label: e.target.value },
                      },
                    })
                  }
                  placeholder="Bug Fix"
                />
              </div>
              <Switch
                checked={settings.categories.fix.enabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    categories: {
                      ...settings.categories,
                      fix: { ...settings.categories.fix, enabled: checked },
                    },
                  })
                }
              />
            </div>
          </Card>

          {/* Announcement */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <div className="flex-1">
                <Input
                  value={settings.categories.announcement.label}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      categories: {
                        ...settings.categories,
                        announcement: { ...settings.categories.announcement, label: e.target.value },
                      },
                    })
                  }
                  placeholder="Announcement"
                />
              </div>
              <Switch
                checked={settings.categories.announcement.enabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    categories: {
                      ...settings.categories,
                      announcement: { ...settings.categories.announcement, enabled: checked },
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
