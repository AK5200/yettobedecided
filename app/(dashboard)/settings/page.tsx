'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
  is_private?: boolean
  is_read_only?: boolean
  language?: string
}

interface FooterLink {
  id: string
  label: string
  url: string
}

export default function GeneralSettingsPage() {
  const supabase = createClient()
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([])

  useEffect(() => {
    fetchOrg()
  }, [])

  const fetchOrg = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('org_members')
      .select('organizations(*)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (membership?.organizations) {
      const orgData = membership.organizations as unknown as Organization
      setOrg(orgData)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!org) return
    setSaving(true)

    const { error } = await supabase
      .from('organizations')
      .update({
        name: org.name,
        is_private: org.is_private,
        is_read_only: org.is_read_only,
        language: org.language,
      })
      .eq('id', org.id)

    if (error) {
      toast.error('Failed to save settings')
    } else {
      toast.success('Settings saved!')
    }
    setSaving(false)
  }

  const addFooterLink = () => {
    setFooterLinks([...footerLinks, { id: Date.now().toString(), label: '', url: '' }])
  }

  const removeFooterLink = (id: string) => {
    setFooterLinks(footerLinks.filter((link) => link.id !== id))
  }

  const updateFooterLink = (id: string, field: 'label' | 'url', value: string) => {
    setFooterLinks(
      footerLinks.map((link) =>
        link.id === id ? { ...link, [field]: value } : link
      )
    )
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
      <h1 className="text-2xl font-bold text-gray-900 mb-8">General</h1>

      {/* Workspace Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Workspace</h2>
        <p className="text-sm text-gray-500 mb-6">
          Workspace settings to tailor the branding, look and feel of your public portal.
        </p>

        <div className="space-y-6">
          {/* Workspace Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Workspace name *</Label>
            <Input
              id="name"
              value={org?.name || ''}
              onChange={(e) => setOrg(org ? { ...org, name: e.target.value } : null)}
              placeholder="Your workspace name"
            />
          </div>
        </div>
      </section>

      <hr className="my-8" />

      {/* Privacy Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between py-4">
          <div>
            <h3 className="font-medium text-gray-900">Make Workspace Private</h3>
            <p className="text-sm text-gray-500">
              Private workspaces are only accessible to team members.
            </p>
          </div>
          <Switch
            checked={org?.is_private || false}
            onCheckedChange={(checked) =>
              setOrg(org ? { ...org, is_private: checked } : null)
            }
          />
        </div>

        <div className="flex items-center justify-between py-4 border-t">
          <div>
            <h3 className="font-medium text-gray-900">Make workspace read only</h3>
            <p className="text-sm text-gray-500">
              User cannot submit any post to your workspace.
            </p>
          </div>
          <Switch
            checked={org?.is_read_only || false}
            onCheckedChange={(checked) =>
              setOrg(org ? { ...org, is_read_only: checked } : null)
            }
          />
        </div>

        <div className="flex items-center justify-between py-4 border-t">
          <div>
            <h3 className="font-medium text-gray-900">Index in search engines like Google</h3>
            <p className="text-sm text-gray-500">
              Allow Indexing of your Public Hub on search engines like Google, Bing, etc.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-600 font-medium">Upgrade</span>
            <Switch disabled />
          </div>
        </div>
      </section>

      <hr className="my-8" />

      {/* Language Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between py-4">
          <div>
            <h3 className="font-medium text-gray-900">Public hub language preference</h3>
            <p className="text-sm text-gray-500">
              Select your preferred language to create a native Public Hub experience.
            </p>
          </div>
          <Select
            value={org?.language || 'en'}
            onValueChange={(value) =>
              setOrg(org ? { ...org, language: value } : null)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇬🇧 English</SelectItem>
              <SelectItem value="es">🇪🇸 Spanish</SelectItem>
              <SelectItem value="fr">🇫🇷 French</SelectItem>
              <SelectItem value="de">🇩🇪 German</SelectItem>
              <SelectItem value="pt">🇵🇹 Portuguese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <hr className="my-8" />

      {/* Footer Links Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-900">Footer Links</h3>
            <p className="text-sm text-gray-500">
              These links will help your users to connect with you or go to your website.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addFooterLink}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        {footerLinks.length > 0 && (
          <div className="space-y-3">
            {footerLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-3">
                <Input
                  placeholder="Link label"
                  value={link.label}
                  onChange={(e) => updateFooterLink(link.id, 'label', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="https://example.com"
                  value={link.url}
                  onChange={(e) => updateFooterLink(link.id, 'url', e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFooterLink(link.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
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
