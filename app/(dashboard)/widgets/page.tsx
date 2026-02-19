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
import { Megaphone, MessageSquare, Sparkles, Layers, Settings, Code, ExternalLink, Copy, Check, Eye, Play } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChangelogPopupPreview } from '@/components/widgets/changelog-popup-preview'
import { ChangelogDropdownPreview } from '@/components/widgets/changelog-dropdown-preview'
import { AnnouncementBannerPreview } from '@/components/widgets/announcement-banner-preview'
import { AllInOnePopupPreview } from '@/components/widgets/all-in-one-popup-preview'
import { AllInOnePopoverPreview } from '@/components/widgets/all-in-one-popover-preview'

export type WidgetSettings = {
  accentColor: string
  backgroundColor: string
  headerBackgroundColor?: string
  showBranding: boolean
  size: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge'
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'xlarge'
  shadow: 'none' | 'small' | 'medium' | 'large'
  heading: string
  subheading: string
  homepageUrl?: string
  autoTriggerEnabled?: boolean
  // All-in-One widget specific settings
  allInOneTextStyle?: 'default' | 'bold' | 'italic' | 'bold-italic'
  allInOnePopoverPlacement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  allInOnePopupPlacement?: 'left' | 'right'
  allInOneStyleVariant?: '1' | '2' | '3'
}

export type AnnouncementSettings = {
  tag: string
  text: string
  accentColor: string
  backgroundColor: string
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'xlarge'
  linkType: 'none' | 'popup' | 'changelog' | 'custom'
  customUrl: string
}

const defaultSettings: WidgetSettings = {
  accentColor: '#F59E0B', // Amber-500
  backgroundColor: '#ffffff',
  headerBackgroundColor: '#ffffff',
  showBranding: true,
  size: 'large',
  borderRadius: 'medium',
  shadow: 'large',
  heading: 'Welcome back 👋',
  subheading: "Here's what we added while you were away.",
  allInOneTextStyle: 'default',
  allInOnePopoverPlacement: 'bottom-right',
  allInOnePopupPlacement: 'right',
  allInOneStyleVariant: '1',
}

const defaultAnnouncementSettings: AnnouncementSettings = {
  tag: 'New',
  text: 'Capture feedback automatically with AI',
  accentColor: '#F59E0B', // Amber-500
  backgroundColor: '#ffffff',
  borderRadius: 'large',
  linkType: 'changelog',
  customUrl: '',
}

type WidgetType = 'changelog-popup' | 'changelog-dropdown' | 'announcement' | 'all-in-one'

export default function WidgetsPage() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgSlug, setOrgSlug] = useState<string>('')
  const [loading, setLoading] = useState(true)
  
  // Widget preview states
  const [previewWidget, setPreviewWidget] = useState<WidgetType | null>(null)
  const [previewVariant, setPreviewVariant] = useState<'popup' | 'dropdown' | 'popover'>('popup')
  
  // Settings states
  const [showSettings, setShowSettings] = useState<WidgetType | null>(null)
  const [showCode, setShowCode] = useState<WidgetType | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState<WidgetSettings>(defaultSettings)
  const [announcementSettings, setAnnouncementSettings] = useState<AnnouncementSettings>(defaultAnnouncementSettings)
  const [saving, setSaving] = useState(false)

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
      } : type === 'all-in-one' ? {
        org_id: orgId,
        widget_type: 'all-in-one',
        accent_color: settings.accentColor,
        background_color: settings.backgroundColor,
        header_background_color: settings.headerBackgroundColor || settings.backgroundColor,
        show_branding: settings.showBranding,
        size: settings.size,
        border_radius: settings.borderRadius,
        shadow: settings.shadow,
        heading: settings.heading,
        subheading: settings.subheading,
        homepage_url: settings.homepageUrl || null,
        auto_trigger_enabled: settings.autoTriggerEnabled || false,
        all_in_one_text_style: settings.allInOneTextStyle || 'default',
        all_in_one_popover_placement: settings.allInOnePopoverPlacement || 'bottom-right',
        all_in_one_popup_placement: settings.allInOnePopupPlacement || 'right',
        all_in_one_style_variant: settings.allInOneStyleVariant || '1',
      } : {
        org_id: orgId,
        widget_type: type,
        accent_color: settings.accentColor,
        background_color: settings.backgroundColor,
        header_background_color: settings.headerBackgroundColor || settings.backgroundColor,
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
              setSettings(prev => ({
                ...prev,
                accentColor: data.settings.accent_color || prev.accentColor,
                backgroundColor: data.settings.background_color || prev.backgroundColor,
                headerBackgroundColor: data.settings.header_background_color || data.settings.background_color || prev.headerBackgroundColor || prev.backgroundColor,
                showBranding: data.settings.show_branding ?? prev.showBranding,
                size: data.settings.size || prev.size,
                borderRadius: data.settings.border_radius || prev.borderRadius,
                shadow: data.settings.shadow || prev.shadow,
                heading: data.settings.heading || prev.heading,
                subheading: data.settings.subheading || prev.subheading,
                homepageUrl: data.settings.homepage_url || prev.homepageUrl,
                autoTriggerEnabled: data.settings.auto_trigger_enabled ?? prev.autoTriggerEnabled,
                allInOneTextStyle: data.settings.all_in_one_text_style || prev.allInOneTextStyle,
                allInOnePopoverPlacement: data.settings.all_in_one_popover_placement || prev.allInOnePopoverPlacement,
                allInOnePopupPlacement: data.settings.all_in_one_popup_placement || prev.allInOnePopupPlacement,
                allInOneStyleVariant: data.settings.all_in_one_style_variant || prev.allInOneStyleVariant,
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

  // Derive base URL from current window location for correct embed code generation
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yettobedecided-8lws.vercel.app'

  // Generate embed codes with comments for customization
  const generateChangelogPopupCode = () => {
    return `<!-- FeedbackHub Changelog Popup Widget -->
<!-- Add this script tag before closing </body> tag -->
<script>
  (function() {
    var script = document.createElement('script');
    // Change this URL to your FeedbackHub instance URL
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    // Replace 'your-workspace' with your actual workspace slug
    script.dataset.org = '${orgSlug}';
    script.dataset.type = 'changelog-popup';
    document.head.appendChild(script);
  })();
</script>

<!-- Optional: Custom trigger button -->
<!-- Uncomment and customize the button below to trigger the popup manually -->
<!--
<button id="feedbackhub-changelog-trigger" style="background: #F59E0B; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;">
  What's New
</button>
-->`
  }

  const generateChangelogDropdownCode = () => {
    return `<!-- FeedbackHub Changelog Dropdown Widget -->
<!-- Add this script tag before closing </body> tag -->
<script>
  (function() {
    var script = document.createElement('script');
    // Change this URL to your FeedbackHub instance URL
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    // Replace 'your-workspace' with your actual workspace slug
    script.dataset.org = '${orgSlug}';
    script.dataset.type = 'changelog-dropdown';
    document.head.appendChild(script);
  })();
</script>

<!-- Add this button where you want the dropdown trigger -->
<!-- Customize the button style below -->
<button id="feedbackhub-changelog-trigger" style="background: #F59E0B; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;">
  What's New
</button>`
  }

  const generateAnnouncementCode = () => {
    const borderRadius = announcementSettings.borderRadius === 'large' ? '9999px' 
      : announcementSettings.borderRadius === 'medium' ? '12px' 
      : announcementSettings.borderRadius === 'small' ? '8px' 
      : '0px'
    
    return `<!-- FeedbackHub Announcement Banner -->
<!-- Customize colors, size, and text below -->
<div class="feedbackhub-announcement" style="
  display: inline-flex; 
  align-items: center; 
  gap: 8px; 
  padding: 8px 16px; 
  border-radius: ${borderRadius}; 
  background-color: ${announcementSettings.backgroundColor}; 
  border: 1px solid ${announcementSettings.accentColor}30; 
  text-decoration: none; 
  transition: box-shadow 0.2s;
">
  <!-- Tag badge - customize color: ${announcementSettings.accentColor} -->
  <!-- Size options: Change font-size to 10px (small), 12px (medium/default), or 14px (large) -->
  <span style="
    font-size: 12px; 
    /* Change to: font-size: 10px; for small, or font-size: 14px; for large */
    font-weight: 600; 
    padding: 2px 10px; 
    border-radius: ${borderRadius}; 
    background-color: ${announcementSettings.accentColor}; 
    color: white;
  ">${announcementSettings.tag}</span>
  
  <!-- Main text - customize: ${announcementSettings.text} -->
  <!-- Size options: Change font-size to 12px (small), 14px (medium/default), or 16px (large) -->
  <span style="font-size: 14px; color: #374151;">
    ${announcementSettings.text}
  </span>
  
  <!-- Optional arrow icon (uncomment if using link) -->
  <!-- <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> -->
</div>

<!-- If using popup trigger, add this script -->
${announcementSettings.linkType === 'popup' ? `<!-- Include this script to enable popup functionality -->
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
</script>` : ''}`
  }

  const generateAllInOneCode = (variant: 'popup' | 'popover') => {
    return `<!-- FeedbackHub All-in-One Widget (${variant === 'popup' ? 'Pop-up' : 'Popover'}) -->
<!-- This widget combines feedback board and changelog in one -->
<script>
  (function() {
    var script = document.createElement('script');
    // Change this URL to your FeedbackHub instance URL
    // Adding version parameter to prevent caching issues
    script.src = '${baseUrl}/widget.js?v=' + new Date().getTime();
    script.async = true;
    // Replace 'your-workspace' with your actual workspace slug
    script.dataset.org = '${orgSlug}';
    script.dataset.type = 'all-in-one-${variant}';
    document.head.appendChild(script);
  })();
</script>

<!-- Optional: Custom trigger button -->
<!-- Uncomment and customize the button below -->
<!--
<button id="feedbackhub-all-in-one-trigger" style="background: #F59E0B; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;">
  Feedback & Updates
</button>
-->`
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading widgets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
            Widgets
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Embed widgets on your website to engage users and collect feedback
          </p>
        </div>
        <Link href="/widgets/docs" target="_blank">
          <Button variant="outline" className="border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50 font-semibold shadow-sm hover:shadow-md transition-all">
            <Code className="h-4 w-4 mr-2" />
            View Documentation
          </Button>
        </Link>
      </div>

      {/* Navbar Link Section */}
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-white shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-md">
              <ExternalLink className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Add to Your Navbar</CardTitle>
              <CardDescription className="text-base mt-1">Add a link to your navigation bar that redirects users to your feedback page</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm border-2 border-amber-100 rounded-xl p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-4">
                Use this code snippet to add a "Feedback" link to your website's navigation bar:
              </p>
              <Button
                size="lg"
                onClick={() => {
                  const code = `<a href="https://yettobedecided-8lws.vercel.app/${orgSlug}/features" target="_blank" style="text-decoration: none; color: inherit;">
  Feedback
</a>`
                  navigator.clipboard.writeText(code)
                  toast.success('Navbar link code copied to clipboard!')
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Code Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 mr-2" />
                    Copy Navbar Link Code
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="font-semibold">💡 Tip:</span>
              Customize the link text ("Feedback") and styling to match your navbar design after copying.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Widget Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* 1. Changelog Popup Widget */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/30 to-white shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Megaphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Changelog Popup</CardTitle>
                  <CardDescription>Show product updates in a centered modal</CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-300 font-semibold">Widget 1</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => {
                  setPreviewWidget('changelog-popup')
                  setPreviewVariant('popup')
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Eye className="h-4 w-4 mr-2" />
                Live Preview
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSettings('changelog-popup')}
                className="border-2 hover:bg-blue-50 hover:border-blue-300 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCode('changelog-popup')}
                className="border-2 hover:bg-blue-50 hover:border-blue-300 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Code className="h-4 w-4 mr-2" />
                Get Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Changelog Dropdown Widget */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/30 to-white shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <Megaphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Changelog Dropdown</CardTitle>
                  <CardDescription>Show updates in a dropdown panel anchored to a button</CardDescription>
                </div>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-purple-300 font-semibold">Widget 2</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => {
                  setPreviewWidget('changelog-dropdown')
                  setPreviewVariant('dropdown')
                }}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Eye className="h-4 w-4 mr-2" />
                Live Preview
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSettings('changelog-dropdown')}
                className="border-2 hover:bg-purple-50 hover:border-purple-300 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCode('changelog-dropdown')}
                className="border-2 hover:bg-purple-50 hover:border-purple-300 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Code className="h-4 w-4 mr-2" />
                Get Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 3. Announcement Banner Widget */}
        <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50/30 to-white shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Announcement Banner</CardTitle>
                  <CardDescription>Hero section banner to highlight new features</CardDescription>
                </div>
              </div>
              <Badge className="bg-pink-100 text-pink-700 border-pink-300 font-semibold">Widget 3</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => {
                  setPreviewWidget('announcement')
                  setPreviewVariant('popup')
                }}
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Eye className="h-4 w-4 mr-2" />
                Live Preview
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSettings('announcement')}
                className="border-2 hover:bg-pink-50 hover:border-pink-300 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCode('announcement')}
                className="border-2 hover:bg-pink-50 hover:border-pink-300 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Code className="h-4 w-4 mr-2" />
                Get Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 4. All-in-One Widget */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-xl shadow-lg">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">All-in-One Widget</CardTitle>
                  <CardDescription>Combine feedback board and changelog in one widget</CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 font-semibold">Widget 4</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => {
                  setPreviewWidget('all-in-one')
                  setPreviewVariant('popup')
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Popup
              </Button>
              <Button 
                onClick={() => {
                  setPreviewWidget('all-in-one')
                  setPreviewVariant('popover')
                }}
                variant="outline"
                className="border-2 hover:bg-emerald-50 hover:border-emerald-300 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Popover
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSettings('all-in-one')}
                className="border-2 hover:bg-emerald-50 hover:border-emerald-300 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCode('all-in-one')}
                className="border-2 hover:bg-emerald-50 hover:border-emerald-300 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Code className="h-4 w-4 mr-2" />
                Get Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modals */}
      {previewWidget === 'changelog-popup' && orgId && (
        <ChangelogPopupPreview
          orgId={orgId}
          orgSlug={orgSlug}
          onClose={() => setPreviewWidget(null)}
          settings={settings}
        />
      )}

      {previewWidget === 'changelog-dropdown' && orgId && (
        <ChangelogDropdownPreview
          orgId={orgId}
          orgSlug={orgSlug}
          onClose={() => setPreviewWidget(null)}
          settings={settings}
        />
      )}

      {previewWidget === 'announcement' && (
        <AnnouncementBannerPreview
          onClose={() => setPreviewWidget(null)}
          settings={announcementSettings}
          orgSlug={orgSlug}
          onOpenPopup={() => {
            setPreviewWidget(null)
            setPreviewWidget('changelog-popup')
            setPreviewVariant('popup')
          }}
        />
      )}

      {previewWidget === 'all-in-one' && orgId && previewVariant === 'popup' && (
        <AllInOnePopupPreview
          orgId={orgId}
          orgSlug={orgSlug}
          onClose={() => setPreviewWidget(null)}
          settings={settings}
        />
      )}

      {previewWidget === 'all-in-one' && orgId && previewVariant === 'popover' && (
        <AllInOnePopoverPreview
          orgId={orgId}
          orgSlug={orgSlug}
          onClose={() => setPreviewWidget(null)}
          settings={settings}
        />
      )}

      {/* Settings Modals - Changelog */}
      <Dialog open={showSettings === 'changelog-popup' || showSettings === 'changelog-dropdown'} onOpenChange={(open) => !open && setShowSettings(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Changelog Widget Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="heading">Heading</Label>
              <Input
                id="heading"
                value={settings.heading}
                onChange={(e) => updateSetting('heading', e.target.value)}
                placeholder="Welcome back 👋"
                className=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subheading">Subheading</Label>
              <Input
                id="subheading"
                value={settings.subheading}
                onChange={(e) => updateSetting('subheading', e.target.value)}
                placeholder="Here's what we added while you were away."
                className=""
              />
            </div>

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
                  placeholder="#F59E0B"
                  className="flex-1 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <p className="text-xs text-muted-foreground">Change this color to match your brand</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Body Background Color</Label>
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
                  className="flex-1 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <p className="text-xs text-muted-foreground">Background color for the posts area</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headerBackgroundColor">Header Background Color</Label>
              <div className="flex gap-3">
                <Input
                  id="headerBackgroundColor"
                  type="color"
                  value={settings.headerBackgroundColor || settings.backgroundColor}
                  onChange={(e) => updateSetting('headerBackgroundColor', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.headerBackgroundColor || settings.backgroundColor}
                  onChange={(e) => updateSetting('headerBackgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <p className="text-xs text-muted-foreground">Background color for the header area (title and description)</p>
            </div>

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
              <p className="text-xs text-muted-foreground">Choose size: small, medium, large, or xlarge</p>
            </div>

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
                  <SelectItem value="xlarge">X-Large (24px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            <div className="pt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSettings(null)}
                className=""
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await saveSettings('changelog')
                  setShowSettings(null)
                }}
                disabled={saving}
                className=""
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal - Announcement */}
      <Dialog open={showSettings === 'announcement'} onOpenChange={(open) => !open && setShowSettings(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Announcement Banner Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag">Tag</Label>
              <Input
                id="tag"
                value={announcementSettings.tag}
                onChange={(e) => updateAnnouncementSetting('tag', e.target.value)}
                placeholder="New"
                className=""
              />
              <p className="text-xs text-muted-foreground">The badge text (e.g., "New", "Update", "Beta")</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-text">Text</Label>
              <Input
                id="announcement-text"
                value={announcementSettings.text}
                onChange={(e) => updateAnnouncementSetting('text', e.target.value)}
                placeholder="Capture feedback automatically with AI"
                className=""
              />
            </div>

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
                  placeholder="#F59E0B"
                  className="flex-1 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <p className="text-xs text-muted-foreground">Change this color: #F59E0B (amber) or use your brand color</p>
            </div>

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
                  className="flex-1 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
            </div>

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
              <p className="text-xs text-muted-foreground">Choose: none, small, medium, or large</p>
            </div>

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
            </div>

            {announcementSettings.linkType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customUrl">Custom URL</Label>
                <Input
                  id="customUrl"
                  value={announcementSettings.customUrl}
                  onChange={(e) => updateAnnouncementSetting('customUrl', e.target.value)}
                  placeholder="https://example.com/feature"
                  className=""
                />
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSettings(null)}
                className=""
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await saveSettings('announcement')
                  setShowSettings(null)
                }}
                disabled={saving}
                className=""
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal - All-in-One */}
      <Dialog open={showSettings === 'all-in-one'} onOpenChange={(open) => !open && setShowSettings(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All-in-One Widget Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="aio-heading">Heading</Label>
              <Input
                id="aio-heading"
                value={settings.heading}
                onChange={(e) => updateSetting('heading', e.target.value)}
                placeholder="Have something to say?"
                className=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aio-subheading">Subheading</Label>
              <Input
                id="aio-subheading"
                value={settings.subheading}
                onChange={(e) => updateSetting('subheading', e.target.value)}
                placeholder="Suggest a feature, read through our feedback..."
                className=""
              />
            </div>

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
                  placeholder="#F59E0B"
                  className="flex-1 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <p className="text-xs text-muted-foreground">Customize accent color: #F59E0B (default amber)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aio-backgroundColor">Body Background Color</Label>
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
                  className="flex-1 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <p className="text-xs text-muted-foreground">Background color for the posts area</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aio-headerBackgroundColor">Header Background Color</Label>
              <div className="flex gap-3">
                <Input
                  id="aio-headerBackgroundColor"
                  type="color"
                  value={settings.headerBackgroundColor || settings.backgroundColor}
                  onChange={(e) => updateSetting('headerBackgroundColor', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.headerBackgroundColor || settings.backgroundColor}
                  onChange={(e) => updateSetting('headerBackgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <p className="text-xs text-muted-foreground">Background color for the header area (title and description)</p>
            </div>

            <div className="space-y-2">
              <Label>Widget Size (Responsive)</Label>
              <Select
                value={settings.size}
                onValueChange={(v) => updateSetting('size', v as WidgetSettings['size'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xsmall">X-Small (25vw)</SelectItem>
                  <SelectItem value="small">Small (35vw)</SelectItem>
                  <SelectItem value="medium">Medium (45vw)</SelectItem>
                  <SelectItem value="large">Large (55vw)</SelectItem>
                  <SelectItem value="xlarge">X-Large (70vw)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Responsive size based on viewport width (vw). Applies to both popup and popover.</p>
            </div>

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
                  <SelectItem value="xlarge">X-Large (24px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            {/* All-in-One Specific Settings */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-medium text-sm">All-in-One Widget Options</h3>
              
              <div className="space-y-2">
                <Label>Text Style</Label>
                <Select
                  value={settings.allInOneTextStyle || 'default'}
                  onValueChange={(v) => updateSetting('allInOneTextStyle', v as WidgetSettings['allInOneTextStyle'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="italic">Italic</SelectItem>
                    <SelectItem value="bold-italic">Bold & Italic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Popover Placement</Label>
                <Select
                  value={settings.allInOnePopoverPlacement || 'bottom-right'}
                  onValueChange={(v) => updateSetting('allInOnePopoverPlacement', v as WidgetSettings['allInOnePopoverPlacement'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Popup Placement</Label>
                <Select
                  value={settings.allInOnePopupPlacement || 'right'}
                  onValueChange={(v) => updateSetting('allInOnePopupPlacement', v as WidgetSettings['allInOnePopupPlacement'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Side of screen for popup widget</p>
              </div>

              <div className="space-y-2">
                <Label>Style Variant</Label>
                <Select
                  value={settings.allInOneStyleVariant || '1'}
                  onValueChange={(v) => updateSetting('allInOneStyleVariant', v as WidgetSettings['allInOneStyleVariant'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Style 1</SelectItem>
                    <SelectItem value="2">Style 2</SelectItem>
                    <SelectItem value="3">Style 3</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Your site, your choice</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSettings(null)}
                className=""
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await saveSettings('all-in-one')
                  setShowSettings(null)
                }}
                disabled={saving}
                className=""
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Code Modals */}
      <Dialog open={showCode === 'changelog-popup'} onOpenChange={(open) => !open && setShowCode(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Embed Changelog Popup Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <div className="relative">
                <Textarea
                  value={generateChangelogPopupCode()}
                  readOnly
                  className="font-mono text-sm h-80 resize-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(generateChangelogPopupCode())}
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
                Customize colors and sizes in the Settings above.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCode === 'changelog-dropdown'} onOpenChange={(open) => !open && setShowCode(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Embed Changelog Dropdown Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <div className="relative">
                <Textarea
                  value={generateChangelogDropdownCode()}
                  readOnly
                  className="font-mono text-sm h-80 resize-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(generateChangelogDropdownCode())}
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
                Add this code to your website's HTML. Customize the button style in the code.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCode === 'announcement'} onOpenChange={(open) => !open && setShowCode(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Embed Announcement Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <div className="relative">
                <Textarea
                  value={generateAnnouncementCode()}
                  readOnly
                  className="font-mono text-sm h-96 resize-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(generateAnnouncementCode())}
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
                Add this HTML to your hero section. All customization options are commented in the code.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCode === 'all-in-one'} onOpenChange={(open) => !open && setShowCode(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Embed All-in-One Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Widget Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={previewVariant === 'popover' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewVariant('popover')}
                  className={previewVariant === 'popover' ? '' : ''}
                >
                  Popover
                </Button>
                <Button
                  variant={previewVariant === 'popup' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewVariant('popup')}
                  className={previewVariant === 'popup' ? '' : ''}
                >
                  Pop-up
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {previewVariant === 'popover'
                  ? 'Shows a side-positioned panel with feedback board and changelog'
                  : 'Shows a centered modal with feedback board and changelog'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Embed Code</Label>
              <div className="relative">
                <Textarea
                  value={generateAllInOneCode(previewVariant === 'popup' ? 'popup' : 'popover')}
                  readOnly
                  className="font-mono text-sm h-80 resize-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(generateAllInOneCode(previewVariant === 'popup' ? 'popup' : 'popover'))}
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
                Add this code to your website's HTML. Customize settings in the Settings modal above.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
