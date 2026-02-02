'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Megaphone, MessageSquare, Map, Settings, Code, ExternalLink, Copy, Check, Database, Sparkles, Layers, Info, Globe, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { ChangelogPopupPreview } from '@/components/widgets/changelog-popup-preview'
import { ChangelogDropdownPreview } from '@/components/widgets/changelog-dropdown-preview'
import { AnnouncementBannerPreview } from '@/components/widgets/announcement-banner-preview'
import { AllInOnePopupPreview } from '@/components/widgets/all-in-one-popup-preview'
import { AllInOnePopoverPreview } from '@/components/widgets/all-in-one-popover-preview'
import { toast } from 'sonner'

export type WidgetSettings = {
  accentColor: string
  backgroundColor: string
  showBranding: boolean
  size: 'small' | 'medium' | 'large' | 'xlarge'
  borderRadius: 'none' | 'small' | 'medium' | 'large'
  shadow: 'none' | 'small' | 'medium' | 'large'
  heading: string
  subheading: string
  homepageUrl?: string
  autoTriggerEnabled?: boolean
}

export type AnnouncementSettings = {
  tag: string
  text: string
  accentColor: string
  backgroundColor: string
  borderRadius: 'none' | 'small' | 'medium' | 'large'
  linkType: 'none' | 'popup' | 'changelog' | 'custom'
  customUrl: string
}

const defaultSettings: WidgetSettings = {
  accentColor: '#7c3aed',
  backgroundColor: '#ffffff',
  showBranding: true,
  size: 'large',
  borderRadius: 'medium',
  shadow: 'large',
  heading: 'Welcome back 👋',
  subheading: "Here's what we added while you were away.",
}

const defaultAnnouncementSettings: AnnouncementSettings = {
  tag: 'New',
  text: 'Capture feedback automatically with AI',
  accentColor: '#7c3aed',
  backgroundColor: '#ffffff',
  borderRadius: 'large',
  linkType: 'changelog',
  customUrl: '',
}

export default function WidgetsPage() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgSlug, setOrgSlug] = useState<string>('')
  const [showPopup, setShowPopup] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAnnouncementSettings, setShowAnnouncementSettings] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [showAnnouncementCode, setShowAnnouncementCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [widgetType, setWidgetType] = useState<'popup' | 'dropdown'>('popup')
  const [seeding, setSeeding] = useState(false)
  // All-in-One Widget state
  const [showAllInOnePopup, setShowAllInOnePopup] = useState(false)
  const [showAllInOnePopover, setShowAllInOnePopover] = useState(false)
  const [showAllInOneSettings, setShowAllInOneSettings] = useState(false)
  const [showAllInOneCode, setShowAllInOneCode] = useState(false)
  const [allInOneWidgetType, setAllInOneWidgetType] = useState<'popup' | 'popover'>('popup')
  // Feedback Portal state
  const [showPortalCode, setShowPortalCode] = useState(false)
  const [portalCopied, setPortalCopied] = useState(false)

  // Settings state
  const [settings, setSettings] = useState<WidgetSettings>(defaultSettings)
  const [announcementSettings, setAnnouncementSettings] = useState<AnnouncementSettings>(defaultAnnouncementSettings)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const updateSetting = <K extends keyof WidgetSettings>(key: K, value: WidgetSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateAnnouncementSetting = <K extends keyof AnnouncementSettings>(key: K, value: AnnouncementSettings[K]) => {
    setAnnouncementSettings(prev => ({ ...prev, [key]: value }))
  }

  // Save settings to database
  const saveSettings = async (type: 'changelog' | 'announcement' | 'all-in-one') => {
    if (!orgId) return
    setSaving(true)
    try {
      const settingsToSave = type === 'announcement' ? {
        org_id: orgId,
        widget_type: 'announcement',
        ...announcementSettings,
      } : {
        org_id: orgId,
        widget_type: type,
        accent_color: settings.accentColor,
        background_color: settings.backgroundColor,
        show_branding: settings.showBranding,
        size: settings.size,
        border_radius: settings.borderRadius,
        shadow: settings.shadow,
        heading: settings.heading,
        subheading: settings.subheading,
        homepage_url: settings.homepageUrl || null,
        auto_trigger_enabled: settings.autoTriggerEnabled || false,
      }

      const res = await fetch('/api/widget-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      })

      if (res.ok) {
        toast.success('Settings saved! Changes will reflect automatically on customer sites.')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const fetchOrg = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id, organizations(id, name, slug)')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (membership) {
        setOrgId(membership.org_id)
        const org = membership.organizations as any
        setOrgSlug(org?.slug || '')

        // Load existing settings from database
        try {
          const res = await fetch(`/api/widget-settings?org_id=${membership.org_id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.settings) {
              // Map database fields to component state
              setSettings(prev => ({
                ...prev,
                accentColor: data.settings.accent_color || prev.accentColor,
                backgroundColor: data.settings.background_color || prev.backgroundColor,
                showBranding: data.settings.show_branding ?? prev.showBranding,
                size: data.settings.size || prev.size,
                borderRadius: data.settings.border_radius || prev.borderRadius,
                shadow: data.settings.shadow || prev.shadow,
                heading: data.settings.heading || prev.heading,
                subheading: data.settings.subheading || prev.subheading,
                homepageUrl: data.settings.homepage_url || prev.homepageUrl,
                autoTriggerEnabled: data.settings.auto_trigger_enabled ?? prev.autoTriggerEnabled,
              }))
            }
          }
        } catch {
          console.error('Failed to load widget settings')
        }
      }
      setLoading(false)
    }
    fetchOrg()
  }, [])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // Simple embed codes - settings are fetched from API dynamically
  const popupCode = `<!-- FeedbackHub Changelog Popup Widget -->
<!-- Settings are managed in your dashboard and load automatically -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    script.dataset.org = '${orgSlug}';
    script.dataset.type = 'changelog-popup';
    document.head.appendChild(script);
  })();
</script>`

  const dropdownCode = `<!-- FeedbackHub Changelog Dropdown Widget -->
<!-- Settings are managed in your dashboard and load automatically -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    script.dataset.org = '${orgSlug}';
    script.dataset.type = 'changelog-dropdown';
    document.head.appendChild(script);
  })();
</script>

<!-- Add this button where you want the dropdown trigger -->
<button id="feedbackhub-changelog-trigger">
  What's New
</button>`

  const handleCopy = () => {
    const code = widgetType === 'popup' ? popupCode : dropdownCode
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const seedSampleData = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/changelog/seed', { method: 'POST' })
      if (res.ok) {
        toast.success('Sample changelog entries created!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to seed data')
      }
    } catch {
      toast.error('Failed to seed data')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Widgets</h1>
          <p className="text-muted-foreground mt-1">
            Embed widgets on your website to engage users
          </p>
        </div>
        <Link href="/widgets/docs" target="_blank">
          <Button variant="outline">
            <Code className="h-4 w-4 mr-2" />
            View Documentation
          </Button>
        </Link>
      </div>

      {/* Dynamic Settings Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">Dynamic Settings</p>
          <p className="text-blue-700 mt-1">
            Settings you configure here are automatically applied to all widgets using your embed code.
            No need to update your embed code when you change settings - changes reflect immediately on your site.
          </p>
        </div>
      </div>

      {/* Feedback Portal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Globe className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Feedback Portal</CardTitle>
              <CardDescription>Your public hub with feedback boards, changelog, and roadmap</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => window.open(`/${orgSlug}`, '_blank')} disabled={!orgSlug}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Portal
            </Button>
            <Button variant="outline" onClick={() => window.open(`/${orgSlug}/changelog`, '_blank')} disabled={!orgSlug}>
              <Megaphone className="h-4 w-4 mr-2" />
              Changelog
            </Button>
            <Button variant="outline" onClick={() => window.open(`/${orgSlug}/roadmap`, '_blank')} disabled={!orgSlug}>
              <Map className="h-4 w-4 mr-2" />
              Roadmap
            </Button>
            <Button variant="outline" onClick={() => setShowPortalCode(true)}>
              <Code className="h-4 w-4 mr-2" />
              Get Link
            </Button>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Portal URL:</strong>{' '}
              <code className="text-xs bg-background px-2 py-1 rounded">
                {baseUrl}/{orgSlug}
              </code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Changelog Widget */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Megaphone className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Changelog Widget</CardTitle>
              <CardDescription>Show product updates to your users</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowPopup(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Popup
            </Button>
            <Button variant="outline" onClick={() => setShowDropdown(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Dropdown
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={() => setShowCode(true)}>
              <Code className="h-4 w-4 mr-2" />
              Get Code
            </Button>
            <Button variant="ghost" onClick={seedSampleData} disabled={seeding}>
              <Database className="h-4 w-4 mr-2" />
              {seeding ? 'Seeding...' : 'Seed Sample Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcement Banner Widget */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Announcement Banner</CardTitle>
              <CardDescription>Hero section banner to highlight new features</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowAnnouncement(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={() => setShowAnnouncementSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={() => setShowAnnouncementCode(true)}>
              <Code className="h-4 w-4 mr-2" />
              Get Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* All-in-One Widget */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Layers className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">All-in-One Widget</CardTitle>
              <CardDescription>Combine feedback board and changelog in one widget</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowAllInOnePopover(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Popover
            </Button>
            <Button variant="outline" onClick={() => setShowAllInOnePopup(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Pop-up
            </Button>
            <Button variant="outline" onClick={() => setShowAllInOneSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={() => setShowAllInOneCode(true)}>
              <Code className="h-4 w-4 mr-2" />
              Get Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Widget - Coming Soon */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Feedback Widget</CardTitle>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <CardDescription>Collect feedback from your users</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Roadmap Widget - Coming Soon */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Map className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Roadmap Widget</CardTitle>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <CardDescription>Share your product roadmap</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Changelog Popup Preview */}
      {showPopup && orgId && (
        <ChangelogPopupPreview
          orgId={orgId}
          orgSlug={orgSlug}
          onClose={() => setShowPopup(false)}
          settings={settings}
        />
      )}

      {/* Changelog Dropdown Preview */}
      {showDropdown && orgId && (
        <ChangelogDropdownPreview
          orgId={orgId}
          orgSlug={orgSlug}
          onClose={() => setShowDropdown(false)}
          settings={settings}
        />
      )}

      {/* Announcement Banner Preview */}
      {showAnnouncement && (
        <AnnouncementBannerPreview
          onClose={() => setShowAnnouncement(false)}
          settings={announcementSettings}
          orgSlug={orgSlug}
          onOpenPopup={() => {
            setShowAnnouncement(false)
            setShowPopup(true)
          }}
        />
      )}

      {/* All-in-One Popup Preview */}
      {showAllInOnePopup && orgId && (
        <AllInOnePopupPreview
          orgId={orgId}
          orgSlug={orgSlug}
          onClose={() => setShowAllInOnePopup(false)}
          settings={settings}
        />
      )}

      {/* All-in-One Popover Preview */}
      {showAllInOnePopover && orgId && (
        <AllInOnePopoverPreview
          orgId={orgId}
          orgSlug={orgSlug}
          onClose={() => setShowAllInOnePopover(false)}
          settings={settings}
        />
      )}

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Changelog Widget Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Heading */}
            <div className="space-y-2">
              <Label htmlFor="heading">Heading</Label>
              <Input
                id="heading"
                value={settings.heading}
                onChange={(e) => updateSetting('heading', e.target.value)}
                placeholder="Welcome back 👋"
              />
            </div>

            {/* Subheading */}
            <div className="space-y-2">
              <Label htmlFor="subheading">Subheading</Label>
              <Input
                id="subheading"
                value={settings.subheading}
                onChange={(e) => updateSetting('subheading', e.target.value)}
                placeholder="Here's what we added while you were away."
              />
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-3">
                <Input
                  id="accentColor"
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => updateSetting('accentColor', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.accentColor}
                  onChange={(e) => updateSetting('accentColor', e.target.value)}
                  placeholder="#7c3aed"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-3">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label>Dialog Size</Label>
              <Select
                value={settings.size}
                onValueChange={(v) => updateSetting('size', v as WidgetSettings['size'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (480px)</SelectItem>
                  <SelectItem value="medium">Medium (560px)</SelectItem>
                  <SelectItem value="large">Large (680px)</SelectItem>
                  <SelectItem value="xlarge">X-Large (780px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label>Border Radius (Edge Curve)</Label>
              <Select
                value={settings.borderRadius}
                onValueChange={(v) => updateSetting('borderRadius', v as WidgetSettings['borderRadius'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (0px)</SelectItem>
                  <SelectItem value="small">Small (8px)</SelectItem>
                  <SelectItem value="medium">Medium (12px)</SelectItem>
                  <SelectItem value="large">Large (16px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shadow */}
            <div className="space-y-2">
              <Label>Shadow</Label>
              <Select
                value={settings.shadow}
                onValueChange={(v) => updateSetting('shadow', v as WidgetSettings['shadow'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Branding */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Branding</Label>
                <p className="text-xs text-muted-foreground">
                  Display "Powered by FeedbackHub"
                </p>
              </div>
              <Switch
                checked={settings.showBranding}
                onCheckedChange={(v) => updateSetting('showBranding', v)}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={async () => {
                  await saveSettings('changelog')
                  setShowSettings(false)
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Get Code Modal */}
      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed Changelog Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Widget Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={widgetType === 'popup' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWidgetType('popup')}
                >
                  Popup
                </Button>
                <Button
                  variant={widgetType === 'dropdown' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWidgetType('dropdown')}
                >
                  Dropdown
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {widgetType === 'popup'
                  ? 'Shows a centered modal when triggered'
                  : 'Shows a dropdown panel anchored to a button'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Embed Code</Label>
              <div className="relative">
                <Textarea
                  value={widgetType === 'popup' ? popupCode : dropdownCode}
                  readOnly
                  className="font-mono text-sm h-64 resize-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this code to your website's HTML, preferably before the closing &lt;/body&gt; tag.
              </p>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-1">Preview your widget</p>
              <p className="text-xs text-muted-foreground">
                Use the "Open Popup" or "Open Dropdown" buttons above to see how your widget will look.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcement Settings Modal */}
      <Dialog open={showAnnouncementSettings} onOpenChange={setShowAnnouncementSettings}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Announcement Banner Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Tag */}
            <div className="space-y-2">
              <Label htmlFor="tag">Tag</Label>
              <Input
                id="tag"
                value={announcementSettings.tag}
                onChange={(e) => updateAnnouncementSetting('tag', e.target.value)}
                placeholder="New"
              />
              <p className="text-xs text-muted-foreground">
                The badge text (e.g., "New", "Update", "Beta")
              </p>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <Label htmlFor="announcement-text">Text</Label>
              <Input
                id="announcement-text"
                value={announcementSettings.text}
                onChange={(e) => updateAnnouncementSetting('text', e.target.value)}
                placeholder="Capture feedback automatically with AI"
              />
              <p className="text-xs text-muted-foreground">
                The main announcement text
              </p>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <Label htmlFor="announcement-accentColor">Accent Color</Label>
              <div className="flex gap-3">
                <Input
                  id="announcement-accentColor"
                  type="color"
                  value={announcementSettings.accentColor}
                  onChange={(e) => updateAnnouncementSetting('accentColor', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={announcementSettings.accentColor}
                  onChange={(e) => updateAnnouncementSetting('accentColor', e.target.value)}
                  placeholder="#7c3aed"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Color for the tag badge
              </p>
            </div>

            {/* Background Color */}
            <div className="space-y-2">
              <Label htmlFor="announcement-backgroundColor">Background Color</Label>
              <div className="flex gap-3">
                <Input
                  id="announcement-backgroundColor"
                  type="color"
                  value={announcementSettings.backgroundColor}
                  onChange={(e) => updateAnnouncementSetting('backgroundColor', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={announcementSettings.backgroundColor}
                  onChange={(e) => updateAnnouncementSetting('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Background color for the banner pill
              </p>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label>Border Radius</Label>
              <Select
                value={announcementSettings.borderRadius}
                onValueChange={(v) => updateAnnouncementSetting('borderRadius', v as AnnouncementSettings['borderRadius'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (0px)</SelectItem>
                  <SelectItem value="small">Small (8px)</SelectItem>
                  <SelectItem value="medium">Medium (12px)</SelectItem>
                  <SelectItem value="large">Large (Full pill)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Link Type */}
            <div className="space-y-2">
              <Label>Click Action</Label>
              <Select
                value={announcementSettings.linkType}
                onValueChange={(v) => updateAnnouncementSetting('linkType', v as AnnouncementSettings['linkType'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No action</SelectItem>
                  <SelectItem value="popup">Open changelog popup</SelectItem>
                  <SelectItem value="changelog">Go to changelog page</SelectItem>
                  <SelectItem value="custom">Custom URL</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {announcementSettings.linkType === 'none' && 'Banner will not be clickable'}
                {announcementSettings.linkType === 'popup' && 'Opens the changelog popup widget'}
                {announcementSettings.linkType === 'changelog' && `Goes to /${orgSlug}/changelog`}
                {announcementSettings.linkType === 'custom' && 'Opens your custom URL'}
              </p>
            </div>

            {/* Custom URL - only show when linkType is custom */}
            {announcementSettings.linkType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customUrl">Custom URL</Label>
                <Input
                  id="customUrl"
                  value={announcementSettings.customUrl}
                  onChange={(e) => updateAnnouncementSetting('customUrl', e.target.value)}
                  placeholder="https://example.com/feature"
                />
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button
                onClick={async () => {
                  await saveSettings('announcement')
                  setShowAnnouncementSettings(false)
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcement Code Modal */}
      <Dialog open={showAnnouncementCode} onOpenChange={setShowAnnouncementCode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed Announcement Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <div className="relative">
                <Textarea
                  value={(() => {
                    const borderRadius = announcementSettings.borderRadius === 'large' ? '9999px' : announcementSettings.borderRadius === 'medium' ? '12px' : announcementSettings.borderRadius === 'small' ? '8px' : '0px'
                    const baseStyles = `display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: ${borderRadius}; background-color: ${announcementSettings.backgroundColor}; border: 1px solid ${announcementSettings.accentColor}30; text-decoration: none; transition: box-shadow 0.2s;`
                    const tagStyles = `font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: ${borderRadius}; background-color: ${announcementSettings.accentColor}; color: white;`
                    const arrowSvg = announcementSettings.linkType !== 'none'
                      ? `\n  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`
                      : ''

                    if (announcementSettings.linkType === 'none') {
                      return `<!-- FeedbackHub Announcement Banner -->
<span class="feedbackhub-announcement" style="${baseStyles}">
  <span style="${tagStyles}">${announcementSettings.tag}</span>
  <span style="font-size: 14px; color: #374151;">${announcementSettings.text}</span>
</span>`
                    } else if (announcementSettings.linkType === 'popup') {
                      return `<!-- FeedbackHub Announcement Banner (opens changelog popup) -->
<a
  href="#"
  id="feedbackhub-announcement-trigger"
  class="feedbackhub-announcement"
  style="${baseStyles}"
>
  <span style="${tagStyles}">${announcementSettings.tag}</span>
  <span style="font-size: 14px; color: #374151;">${announcementSettings.text}</span>${arrowSvg}
</a>

<!-- Include this script to enable popup functionality -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    script.dataset.org = '${orgSlug}';
    script.dataset.type = 'changelog-popup';
    script.dataset.trigger = 'feedbackhub-announcement-trigger';
    document.head.appendChild(script);
  })();
</script>`
                    } else {
                      const href = announcementSettings.linkType === 'changelog'
                        ? `${baseUrl}/${orgSlug}/changelog`
                        : announcementSettings.customUrl || '#'
                      return `<!-- FeedbackHub Announcement Banner -->
<a
  href="${href}"
  class="feedbackhub-announcement"
  style="${baseStyles}"
>
  <span style="${tagStyles}">${announcementSettings.tag}</span>
  <span style="font-size: 14px; color: #374151;">${announcementSettings.text}</span>${arrowSvg}
</a>`
                    }
                  })()}
                  readOnly
                  className="font-mono text-sm h-80 resize-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    const borderRadius = announcementSettings.borderRadius === 'large' ? '9999px' : announcementSettings.borderRadius === 'medium' ? '12px' : announcementSettings.borderRadius === 'small' ? '8px' : '0px'
                    const baseStyles = `display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: ${borderRadius}; background-color: ${announcementSettings.backgroundColor}; border: 1px solid ${announcementSettings.accentColor}30; text-decoration: none; transition: box-shadow 0.2s;`
                    const tagStyles = `font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: ${borderRadius}; background-color: ${announcementSettings.accentColor}; color: white;`
                    const arrowSvg = announcementSettings.linkType !== 'none'
                      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`
                      : ''

                    let code = ''
                    if (announcementSettings.linkType === 'none') {
                      code = `<span class="feedbackhub-announcement" style="${baseStyles}"><span style="${tagStyles}">${announcementSettings.tag}</span><span style="font-size: 14px; color: #374151;">${announcementSettings.text}</span></span>`
                    } else if (announcementSettings.linkType === 'popup') {
                      code = `<a href="#" id="feedbackhub-announcement-trigger" class="feedbackhub-announcement" style="${baseStyles}"><span style="${tagStyles}">${announcementSettings.tag}</span><span style="font-size: 14px; color: #374151;">${announcementSettings.text}</span>${arrowSvg}</a>
<script>(function(){var s=document.createElement('script');s.src='${baseUrl}/widget.js';s.async=true;s.dataset.org='${orgSlug}';s.dataset.type='changelog-popup';s.dataset.trigger='feedbackhub-announcement-trigger';document.head.appendChild(s);})();</script>`
                    } else {
                      const href = announcementSettings.linkType === 'changelog'
                        ? `${baseUrl}/${orgSlug}/changelog`
                        : announcementSettings.customUrl || '#'
                      code = `<a href="${href}" class="feedbackhub-announcement" style="${baseStyles}"><span style="${tagStyles}">${announcementSettings.tag}</span><span style="font-size: 14px; color: #374151;">${announcementSettings.text}</span>${arrowSvg}</a>`
                    }

                    navigator.clipboard.writeText(code)
                    setCopied(true)
                    toast.success('Code copied to clipboard!')
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this HTML to your hero section, typically above your main heading.
                {announcementSettings.linkType === 'popup' && ' The script will enable the changelog popup on click.'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* All-in-One Settings Modal */}
      <Dialog open={showAllInOneSettings} onOpenChange={setShowAllInOneSettings}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All-in-One Widget Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Heading */}
            <div className="space-y-2">
              <Label htmlFor="aio-heading">Heading</Label>
              <Input
                id="aio-heading"
                value={settings.heading}
                onChange={(e) => updateSetting('heading', e.target.value)}
                placeholder="Have something to say?"
              />
            </div>

            {/* Subheading */}
            <div className="space-y-2">
              <Label htmlFor="aio-subheading">Subheading</Label>
              <Input
                id="aio-subheading"
                value={settings.subheading}
                onChange={(e) => updateSetting('subheading', e.target.value)}
                placeholder="Suggest a feature, read through our feedback..."
              />
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <Label htmlFor="aio-accentColor">Accent Color</Label>
              <div className="flex gap-3">
                <Input
                  id="aio-accentColor"
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => updateSetting('accentColor', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.accentColor}
                  onChange={(e) => updateSetting('accentColor', e.target.value)}
                  placeholder="#7c3aed"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-2">
              <Label htmlFor="aio-backgroundColor">Background Color</Label>
              <div className="flex gap-3">
                <Input
                  id="aio-backgroundColor"
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label>Widget Size</Label>
              <Select
                value={settings.size}
                onValueChange={(v) => updateSetting('size', v as WidgetSettings['size'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xlarge">X-Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label>Border Radius</Label>
              <Select
                value={settings.borderRadius}
                onValueChange={(v) => updateSetting('borderRadius', v as WidgetSettings['borderRadius'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (0px)</SelectItem>
                  <SelectItem value="small">Small (8px)</SelectItem>
                  <SelectItem value="medium">Medium (12px)</SelectItem>
                  <SelectItem value="large">Large (16px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shadow */}
            <div className="space-y-2">
              <Label>Shadow</Label>
              <Select
                value={settings.shadow}
                onValueChange={(v) => updateSetting('shadow', v as WidgetSettings['shadow'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Branding */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Branding</Label>
                <p className="text-xs text-muted-foreground">
                  Display "Powered by FeedbackHub"
                </p>
              </div>
              <Switch
                checked={settings.showBranding}
                onCheckedChange={(v) => updateSetting('showBranding', v)}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={async () => {
                  await saveSettings('all-in-one')
                  setShowAllInOneSettings(false)
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* All-in-One Get Code Modal */}
      <Dialog open={showAllInOneCode} onOpenChange={setShowAllInOneCode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed All-in-One Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Widget Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={allInOneWidgetType === 'popover' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAllInOneWidgetType('popover')}
                >
                  Popover
                </Button>
                <Button
                  variant={allInOneWidgetType === 'popup' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAllInOneWidgetType('popup')}
                >
                  Pop-up
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {allInOneWidgetType === 'popover'
                  ? 'Shows a side-positioned panel with feedback board and changelog'
                  : 'Shows a centered modal with feedback board and changelog'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Embed Code</Label>
              <div className="relative">
                <Textarea
                  value={allInOneWidgetType === 'popover'
                    ? `<!-- FeedbackHub All-in-One Widget (Popover) -->
<!-- Settings are managed in your dashboard and load automatically -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    script.dataset.org = '${orgSlug}';
    script.dataset.type = 'all-in-one-popover';
    document.head.appendChild(script);
  })();
</script>`
                    : `<!-- FeedbackHub All-in-One Widget (Pop-up) -->
<!-- Settings are managed in your dashboard and load automatically -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    script.dataset.org = '${orgSlug}';
    script.dataset.type = 'all-in-one-popup';
    document.head.appendChild(script);
  })();
</script>`}
                  readOnly
                  className="font-mono text-sm h-56 resize-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    const code = allInOneWidgetType === 'popover'
                      ? `<script>(function(){var s=document.createElement('script');s.src='${baseUrl}/widget.js';s.async=true;s.dataset.org='${orgSlug}';s.dataset.type='all-in-one-popover';document.head.appendChild(s);})();</script>`
                      : `<script>(function(){var s=document.createElement('script');s.src='${baseUrl}/widget.js';s.async=true;s.dataset.org='${orgSlug}';s.dataset.type='all-in-one-popup';document.head.appendChild(s);})();</script>`
                    navigator.clipboard.writeText(code)
                    setCopied(true)
                    toast.success('Code copied to clipboard!')
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this code to your website's HTML, preferably before the closing &lt;/body&gt; tag.
              </p>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-1">Preview your widget</p>
              <p className="text-xs text-muted-foreground">
                Use the "Open Popover" or "Open Pop-up" buttons above to see how your widget will look.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Portal Links Modal */}
      <Dialog open={showPortalCode} onOpenChange={setShowPortalCode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Portal Links</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Share these links with your users to give them access to your feedback portal.
            </p>

            <div className="space-y-3">
              {/* Main Portal */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">Feedback Portal</p>
                  <p className="text-xs text-muted-foreground">{baseUrl}/{orgSlug}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}/${orgSlug}`)
                    setPortalCopied(true)
                    toast.success('Link copied!')
                    setTimeout(() => setPortalCopied(false), 2000)
                  }}
                >
                  {portalCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Changelog */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">Changelog</p>
                  <p className="text-xs text-muted-foreground">{baseUrl}/{orgSlug}/changelog</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}/${orgSlug}/changelog`)
                    toast.success('Link copied!')
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Roadmap */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">Roadmap</p>
                  <p className="text-xs text-muted-foreground">{baseUrl}/{orgSlug}/roadmap</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}/${orgSlug}/roadmap`)
                    toast.success('Link copied!')
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Feature Requests */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">Feature Requests</p>
                  <p className="text-xs text-muted-foreground">{baseUrl}/{orgSlug}/features</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}/${orgSlug}/features`)
                    toast.success('Link copied!')
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> You can add these links to your website's navigation, footer, or help menu to give users easy access to your feedback portal.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
