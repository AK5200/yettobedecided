'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { getClientOrgId } from '@/lib/org-context-client'
import { Switch } from '@/components/ui/switch'
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
  // Auto-detect settings
  autoDetectTheme?: boolean
  autoDetectColor?: boolean
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

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
function MegaphoneIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 3.336L16.5 6.75h.75A2.25 2.25 0 0119.5 9v0a2.25 2.25 0 01-2.25 2.25H16.5l-6.16 3.414A1.125 1.125 0 019 13.665V4.335a1.125 1.125 0 011.34-.999zM3.75 10.5h1.5a.75.75 0 00.75-.75V8.25a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v1.5a.75.75 0 00.75.75zM12 18.75a2.25 2.25 0 002.25-2.25V15" />
    </svg>
  )
}

function SparklesIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  )
}

function LayersIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  )
}

function ExternalLinkIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function CodeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function WidgetIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
    </svg>
  )
}

// ── Settings Form Field ────────────────────────────────────────────────────────
function FormField({ label, hint, htmlFor, children, isDark }: {
  label: string; hint?: string; htmlFor?: string; children: React.ReactNode; isDark: boolean
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
        {label}
      </label>
      {children}
      {hint && (
        <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>{hint}</p>
      )}
    </div>
  )
}

// ── Color Picker Field ─────────────────────────────────────────────────────────
function ColorField({ label, hint, value, onChange, id, isDark }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; id: string; isDark: boolean
}) {
  return (
    <FormField label={label} hint={hint} htmlFor={id} isDark={isDark}>
      <div className="flex gap-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 p-1 cursor-pointer rounded-lg border-0 bg-transparent"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#F59E0B"
          className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
            isDark
              ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-white/30 focus:border-kelo-yellow/40 focus:bg-white/[0.06]'
              : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/60 focus:border-kelo-yellow/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,197,24,0.1)]'
          }`}
        />
      </div>
    </FormField>
  )
}

// ── Text Input Field ───────────────────────────────────────────────────────────
function TextField({ label, hint, value, onChange, placeholder, id, isDark }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder: string; id: string; isDark: boolean
}) {
  return (
    <FormField label={label} hint={hint} htmlFor={id} isDark={isDark}>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
          isDark
            ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-white/30 focus:border-kelo-yellow/40 focus:bg-white/[0.06]'
            : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/60 focus:border-kelo-yellow/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,197,24,0.1)]'
        }`}
      />
    </FormField>
  )
}

export default function WidgetsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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
        auto_detect_theme: settings.autoDetectTheme || false,
        auto_detect_color: settings.autoDetectColor || false,
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
        auto_detect_theme: settings.autoDetectTheme || false,
        auto_detect_color: settings.autoDetectColor || false,
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
      const orgId = await getClientOrgId()
      if (!orgId) return

      setOrgId(orgId)

      // Fetch org slug
      const supabase = createClient()
      const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', orgId)
        .single()
      setOrgSlug(org?.slug || '')

      // Load existing settings from database
      try {
        const res = await fetch(`/api/widget-settings?org_id=${orgId}`)
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
              autoDetectTheme: data.settings.auto_detect_theme ?? prev.autoDetectTheme,
              autoDetectColor: data.settings.auto_detect_color ?? prev.autoDetectColor,
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
      setLoading(false)
    }
    fetchOrg()
  }, [])

  // Derive base URL from current window location for correct embed code generation
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.kelohq.com'

  // Generate embed codes with comments for customization
  const generateChangelogPopupCode = () => {
    return `<!-- Kelo Changelog Popup Widget -->
<!-- Add this before closing </body> tag -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    script.dataset.org = '${orgSlug}';
    script.dataset.type = 'changelog-popup';
    document.head.appendChild(script);
  })();
</script>

<!-- Add data-kelo-trigger to any element to open the widget -->
<button data-kelo-trigger>What's New</button>`
  }

  const generateChangelogDropdownCode = () => {
    return `<!-- Kelo Changelog Dropdown Widget -->
<!-- Add this before closing </body> tag -->
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

<!-- Add data-kelo-trigger to any element to open the dropdown -->
<button data-kelo-trigger>What's New</button>`
  }

  const generateAnnouncementCode = () => {
    const borderRadius = announcementSettings.borderRadius === 'large' ? '9999px'
      : announcementSettings.borderRadius === 'medium' ? '12px'
      : announcementSettings.borderRadius === 'small' ? '8px'
      : '0px'

    return `<!-- Kelo Announcement Banner -->
<!-- Customize colors, size, and text below -->
<div class="kelo-announcement" style="
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
    script.dataset.trigger = 'kelo-announcement-trigger';
    document.head.appendChild(script);
  })();
</script>` : ''}`
  }

  const generateAllInOneCode = (variant: 'popup' | 'popover') => {
    return `<!-- Kelo All-in-One Widget (${variant === 'popup' ? 'Pop-up' : 'Popover'}) -->
<!-- Add this before closing </body> tag -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js?v=' + new Date().getTime();
    script.async = true;
    script.dataset.org = '${orgSlug}';
    script.dataset.type = 'all-in-one-${variant}';
    document.head.appendChild(script);
  })();
</script>

<!-- Add data-kelo-trigger to any element to open the widget -->
<button data-kelo-trigger>Feedback</button>
<!-- Or use it on a navbar link, menu item, etc. -->
<!-- <a href="#" data-kelo-trigger>Feedback</a> -->`
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className={`p-8 flex items-center justify-center min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-kelo-surface'}`}>
        <div className="text-center">
          <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3 ${isDark ? 'border-kelo-yellow' : 'border-kelo-yellow'}`} />
          <p className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>Loading widgets...</p>
        </div>
      </div>
    )
  }

  // Widget card definitions
  const widgets: {
    type: WidgetType
    title: string
    description: string
    accent: string
    icon: React.ReactNode
    hasPopoverPreview?: boolean
  }[] = [
    {
      type: 'changelog-popup',
      title: 'Changelog Popup',
      description: 'Show product updates in a centered modal overlay',
      accent: '#6366F1',
      icon: <MegaphoneIcon className="w-5 h-5" style={{ color: '#6366F1' }} />,
    },
    {
      type: 'changelog-dropdown',
      title: 'Changelog Dropdown',
      description: 'Show updates in a dropdown panel anchored to a button',
      accent: '#8B5CF6',
      icon: <MegaphoneIcon className="w-5 h-5" style={{ color: '#8B5CF6' }} />,
    },
    {
      type: 'announcement',
      title: 'Announcement Banner',
      description: 'Hero section banner to highlight new features',
      accent: '#EC4899',
      icon: <SparklesIcon className="w-5 h-5" style={{ color: '#EC4899' }} />,
    },
    {
      type: 'all-in-one',
      title: 'All-in-One Widget',
      description: 'Combine feedback board and changelog in one widget',
      accent: '#10B981',
      icon: <LayersIcon className="w-5 h-5" style={{ color: '#10B981' }} />,
      hasPopoverPreview: true,
    },
  ]

  return (
    <div className={`p-6 md:p-8 max-w-7xl mx-auto font-sans ${isDark ? '' : ''}`}>

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className={`inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold tracking-widest uppercase ${
          isDark ? 'border-white/10 bg-white/5 text-white/40' : 'border-kelo-border bg-kelo-surface text-kelo-muted'
        }`}>
          <WidgetIcon className="w-3.5 h-3.5" />
          Widgets
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className={`text-3xl md:text-4xl font-display font-extrabold tracking-tight leading-tight mb-2 ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
              Embed widgets
            </h1>
            <p className={`text-base ${isDark ? 'text-white/50' : 'text-kelo-muted'}`}>
              Add widgets to your website to engage users and collect feedback.
            </p>
          </div>
          <Link
            href="/widgets/docs"
            target="_blank"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark"
          >
            <CodeIcon className="w-4 h-4" />
            View Docs
          </Link>
        </div>
      </div>

      {/* ── Navbar Link Section ──────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-6 mb-8 ${
        isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
      }`}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F5C51818' }}>
            <ExternalLinkIcon className="w-5 h-5" style={{ color: '#F5C518' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-lg font-display font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
              Feedback Portal Link
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>
              Your public feedback page where users can submit ideas, vote, and track progress. Add this link anywhere on your website — navbar, footer, sidebar, or help menu.
            </p>
          </div>
        </div>
        <div className={`rounded-xl p-5 mb-4 ${isDark ? 'bg-white/[0.04]' : 'bg-kelo-surface'}`}>
          <p className={`text-sm font-medium mb-4 ${isDark ? 'text-white/60' : 'text-kelo-ink/70'}`}>
            Copy this HTML snippet and paste it into your website&apos;s navigation, footer, or anywhere you want users to access your feedback portal:
          </p>
          <button
            onClick={() => {
              const code = `<a href="https://www.kelohq.com/${orgSlug}/features" target="_blank" style="text-decoration: none; color: inherit;">
  Feedback
</a>`
              navigator.clipboard.writeText(code)
              toast.success('Navbar link code copied to clipboard!')
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark"
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4" />
                Code Copied!
              </>
            ) : (
              <>
                <CopyIcon className="w-4 h-4" />
                Copy Navbar Link Code
              </>
            )}
          </button>
        </div>
        <p className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
          <span className="font-semibold">Tip:</span>
          Customize the link text and styling to match your navbar design after copying.
        </p>
      </div>

      {/* ── Widget Cards Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.map((w) => (
          <div
            key={w.type}
            className={`relative rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden ${
              isDark
                ? 'bg-[#111111] border-white/[0.07] hover:border-white/[0.14]'
                : 'bg-white border-kelo-border hover:border-kelo-border-dark hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
            }`}
          >
            {/* Accent glow */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] blur-2xl pointer-events-none" style={{ background: w.accent }} />

            {/* Icon + Title */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${w.accent}18` }}>
                {w.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-display font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                  {w.title}
                </h3>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>
                  {w.description}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Preview button(s) */}
              {w.hasPopoverPreview ? (
                <>
                  <button
                    onClick={() => { setPreviewWidget(w.type); setPreviewVariant('popup') }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                      isDark
                        ? 'border-white/[0.08] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                        : 'border-kelo-border text-kelo-muted hover:bg-kelo-surface hover:text-kelo-ink'
                    }`}
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    Preview Popup
                  </button>
                  <button
                    onClick={() => { setPreviewWidget(w.type); setPreviewVariant('popover') }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                      isDark
                        ? 'border-white/[0.08] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                        : 'border-kelo-border text-kelo-muted hover:bg-kelo-surface hover:text-kelo-ink'
                    }`}
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    Preview Popover
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setPreviewWidget(w.type)
                    setPreviewVariant(w.type === 'changelog-dropdown' ? 'dropdown' : 'popup')
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                    isDark
                      ? 'border-white/[0.08] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                      : 'border-kelo-border text-kelo-muted hover:bg-kelo-surface hover:text-kelo-ink'
                  }`}
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  Preview
                </button>
              )}

              {/* Settings button */}
              <button
                onClick={() => setShowSettings(w.type)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  isDark
                    ? 'border-white/[0.08] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                    : 'border-kelo-border text-kelo-muted hover:bg-kelo-surface hover:text-kelo-ink'
                }`}
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                Settings
              </button>

              {/* Get Code button (yellow CTA) */}
              <button
                onClick={() => setShowCode(w.type)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark"
              >
                <CodeIcon className="w-3.5 h-3.5" />
                Get Code
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Preview Modals ───────────────────────────────────────────────────── */}
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

      {/* ── Settings Modal: Changelog ────────────────────────────────────────── */}
      <Dialog open={showSettings === 'changelog-popup' || showSettings === 'changelog-dropdown'} onOpenChange={(open) => !open && setShowSettings(null)}>
        <DialogContent className={`max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border ${
          isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
        }`}>
          <DialogHeader>
            <DialogTitle className={`text-lg font-display font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
              Changelog Widget Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <TextField label="Heading" id="heading" value={settings.heading} onChange={(v) => updateSetting('heading', v)} placeholder="Welcome back" isDark={isDark} />
            <TextField label="Subheading" id="subheading" value={settings.subheading} onChange={(v) => updateSetting('subheading', v)} placeholder="Here's what we added while you were away." isDark={isDark} />
            <ColorField label="Accent Color" id="accentColor" value={settings.accentColor} onChange={(v) => updateSetting('accentColor', v)} hint="Change this color to match your brand" isDark={isDark} />
            <ColorField label="Body Background Color" id="backgroundColor" value={settings.backgroundColor} onChange={(v) => updateSetting('backgroundColor', v)} hint="Background color for the posts area" isDark={isDark} />
            <ColorField label="Header Background Color" id="headerBackgroundColor" value={settings.headerBackgroundColor || settings.backgroundColor} onChange={(v) => updateSetting('headerBackgroundColor', v)} hint="Background color for the header area (title and description)" isDark={isDark} />

            <FormField label="Dialog Size" hint="Choose size: small, medium, large, or xlarge" isDark={isDark}>
              <Select value={settings.size} onValueChange={(v) => updateSetting('size', v as WidgetSettings['size'])}>
                <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (480px)</SelectItem>
                  <SelectItem value="medium">Medium (560px)</SelectItem>
                  <SelectItem value="large">Large (680px)</SelectItem>
                  <SelectItem value="xlarge">X-Large (780px)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Border Radius" isDark={isDark}>
              <Select value={settings.borderRadius} onValueChange={(v) => updateSetting('borderRadius', v as WidgetSettings['borderRadius'])}>
                <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
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
            </FormField>

            <FormField label="Shadow" isDark={isDark}>
              <Select value={settings.shadow} onValueChange={(v) => updateSetting('shadow', v as WidgetSettings['shadow'])}>
                <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Auto-open on page load</span>
                <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                  Automatically show the changelog popup when users visit a specific page (once per session)
                </p>
              </div>
              <Switch checked={settings.autoTriggerEnabled || false} onCheckedChange={(v) => updateSetting('autoTriggerEnabled', v)} />
            </div>

            {settings.autoTriggerEnabled && (
              <TextField label="Homepage URL" id="homepageUrl" value={settings.homepageUrl || ''} onChange={(v) => updateSetting('homepageUrl', v)} placeholder="https://yoursite.com" isDark={isDark} />
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Auto-detect dark/light mode</span>
                <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                  Automatically match the widget theme to the user&apos;s website
                </p>
              </div>
              <Switch checked={settings.autoDetectTheme || false} onCheckedChange={(v) => updateSetting('autoDetectTheme', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Auto-detect accent color</span>
                <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                  Automatically pick up the accent color from the user&apos;s website
                </p>
              </div>
              <Switch checked={settings.autoDetectColor || false} onCheckedChange={(v) => updateSetting('autoDetectColor', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Show Branding</span>
                <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                  Display &quot;Powered by Kelo&quot;
                </p>
              </div>
              <Switch checked={settings.showBranding} onCheckedChange={(v) => updateSetting('showBranding', v)} />
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(null)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  isDark
                    ? 'border-white/[0.08] text-white/60 hover:bg-white/[0.06]'
                    : 'border-kelo-border text-kelo-muted hover:bg-kelo-surface'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={async () => { await saveSettings('changelog'); setShowSettings(null) }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Settings Modal: Announcement ─────────────────────────────────────── */}
      <Dialog open={showSettings === 'announcement'} onOpenChange={(open) => !open && setShowSettings(null)}>
        <DialogContent className={`max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border ${
          isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
        }`}>
          <DialogHeader>
            <DialogTitle className={`text-lg font-display font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
              Announcement Banner Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <TextField label="Tag" id="tag" value={announcementSettings.tag} onChange={(v) => updateAnnouncementSetting('tag', v)} placeholder="New" hint='The badge text (e.g., "New", "Update", "Beta")' isDark={isDark} />
            <TextField label="Text" id="announcement-text" value={announcementSettings.text} onChange={(v) => updateAnnouncementSetting('text', v)} placeholder="Capture feedback automatically with AI" isDark={isDark} />
            <ColorField label="Accent Color" id="announcement-accentColor" value={announcementSettings.accentColor} onChange={(v) => updateAnnouncementSetting('accentColor', v)} hint="Change this color: #F59E0B (amber) or use your brand color" isDark={isDark} />
            <ColorField label="Background Color" id="announcement-backgroundColor" value={announcementSettings.backgroundColor} onChange={(v) => updateAnnouncementSetting('backgroundColor', v)} isDark={isDark} />

            <FormField label="Border Radius" hint="Choose: none, small, medium, or large" isDark={isDark}>
              <Select value={announcementSettings.borderRadius} onValueChange={(v) => updateAnnouncementSetting('borderRadius', v as AnnouncementSettings['borderRadius'])}>
                <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (0px)</SelectItem>
                  <SelectItem value="small">Small (8px)</SelectItem>
                  <SelectItem value="medium">Medium (12px)</SelectItem>
                  <SelectItem value="large">Large (Full pill)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Click Action" isDark={isDark}>
              <Select value={announcementSettings.linkType} onValueChange={(v) => updateAnnouncementSetting('linkType', v as AnnouncementSettings['linkType'])}>
                <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No action</SelectItem>
                  <SelectItem value="popup">Open changelog popup</SelectItem>
                  <SelectItem value="changelog">Go to changelog page</SelectItem>
                  <SelectItem value="custom">Custom URL</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {announcementSettings.linkType === 'custom' && (
              <TextField label="Custom URL" id="customUrl" value={announcementSettings.customUrl} onChange={(v) => updateAnnouncementSetting('customUrl', v)} placeholder="https://example.com/feature" isDark={isDark} />
            )}

            {/* Actions */}
            <div className="pt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(null)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  isDark
                    ? 'border-white/[0.08] text-white/60 hover:bg-white/[0.06]'
                    : 'border-kelo-border text-kelo-muted hover:bg-kelo-surface'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={async () => { await saveSettings('announcement'); setShowSettings(null) }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Settings Modal: All-in-One ───────────────────────────────────────── */}
      <Dialog open={showSettings === 'all-in-one'} onOpenChange={(open) => !open && setShowSettings(null)}>
        <DialogContent className={`max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border ${
          isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
        }`}>
          <DialogHeader>
            <DialogTitle className={`text-lg font-display font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
              All-in-One Widget Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <TextField label="Heading" id="aio-heading" value={settings.heading} onChange={(v) => updateSetting('heading', v)} placeholder="Have something to say?" isDark={isDark} />
            <TextField label="Subheading" id="aio-subheading" value={settings.subheading} onChange={(v) => updateSetting('subheading', v)} placeholder="Suggest a feature, read through our feedback..." isDark={isDark} />
            <ColorField label="Accent Color" id="aio-accentColor" value={settings.accentColor} onChange={(v) => updateSetting('accentColor', v)} hint="Customize accent color: #F59E0B (default amber)" isDark={isDark} />
            <ColorField label="Body Background Color" id="aio-backgroundColor" value={settings.backgroundColor} onChange={(v) => updateSetting('backgroundColor', v)} hint="Background color for the posts area" isDark={isDark} />
            <ColorField label="Header Background Color" id="aio-headerBackgroundColor" value={settings.headerBackgroundColor || settings.backgroundColor} onChange={(v) => updateSetting('headerBackgroundColor', v)} hint="Background color for the header area (title and description)" isDark={isDark} />

            <FormField label="Widget Size (Responsive)" hint="Responsive size based on viewport width (vw). Applies to both popup and popover." isDark={isDark}>
              <Select value={settings.size} onValueChange={(v) => updateSetting('size', v as WidgetSettings['size'])}>
                <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
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
            </FormField>

            <FormField label="Border Radius" isDark={isDark}>
              <Select value={settings.borderRadius} onValueChange={(v) => updateSetting('borderRadius', v as WidgetSettings['borderRadius'])}>
                <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
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
            </FormField>

            <FormField label="Shadow" isDark={isDark}>
              <Select value={settings.shadow} onValueChange={(v) => updateSetting('shadow', v as WidgetSettings['shadow'])}>
                <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Show Branding</span>
                <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                  Display &quot;Powered by Kelo&quot;
                </p>
              </div>
              <Switch checked={settings.showBranding} onCheckedChange={(v) => updateSetting('showBranding', v)} />
            </div>

            {/* All-in-One Specific Settings */}
            <div className={`border-t pt-5 space-y-5 ${isDark ? 'border-white/[0.07]' : 'border-kelo-border'}`}>
              <h3 className={`text-sm font-display font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                All-in-One Widget Options
              </h3>

              <FormField label="Text Style" isDark={isDark}>
                <Select value={settings.allInOneTextStyle || 'default'} onValueChange={(v) => updateSetting('allInOneTextStyle', v as WidgetSettings['allInOneTextStyle'])}>
                  <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="italic">Italic</SelectItem>
                    <SelectItem value="bold-italic">Bold & Italic</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Popover Placement" isDark={isDark}>
                <Select value={settings.allInOnePopoverPlacement || 'bottom-right'} onValueChange={(v) => updateSetting('allInOnePopoverPlacement', v as WidgetSettings['allInOnePopoverPlacement'])}>
                  <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Popup Placement" hint="Side of screen for popup widget" isDark={isDark}>
                <Select value={settings.allInOnePopupPlacement || 'right'} onValueChange={(v) => updateSetting('allInOnePopupPlacement', v as WidgetSettings['allInOnePopupPlacement'])}>
                  <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Style Variant" hint="Your site, your choice" isDark={isDark}>
                <Select value={settings.allInOneStyleVariant || '1'} onValueChange={(v) => updateSetting('allInOneStyleVariant', v as WidgetSettings['allInOneStyleVariant'])}>
                  <SelectTrigger className={`rounded-xl ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-kelo-surface border-kelo-border text-kelo-ink'}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Style 1</SelectItem>
                    <SelectItem value="2">Style 2</SelectItem>
                    <SelectItem value="3">Style 3</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Auto-detect dark/light mode</span>
                <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                  Automatically match the widget theme to the user&apos;s website
                </p>
              </div>
              <Switch checked={settings.autoDetectTheme || false} onCheckedChange={(v) => updateSetting('autoDetectTheme', v)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Auto-detect accent color</span>
                <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                  Automatically pick up the accent color from the user&apos;s website
                </p>
              </div>
              <Switch checked={settings.autoDetectColor || false} onCheckedChange={(v) => updateSetting('autoDetectColor', v)} />
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(null)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  isDark
                    ? 'border-white/[0.08] text-white/60 hover:bg-white/[0.06]'
                    : 'border-kelo-border text-kelo-muted hover:bg-kelo-surface'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={async () => { await saveSettings('all-in-one'); setShowSettings(null) }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Code Modal: Changelog Popup ──────────────────────────────────────── */}
      <Dialog open={showCode === 'changelog-popup'} onOpenChange={(open) => !open && setShowCode(null)}>
        <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
          isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
        }`}>
          <DialogHeader>
            <DialogTitle className={`text-lg font-display font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
              Embed Changelog Popup Widget
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Embed Code" isDark={isDark}>
              <div className="relative">
                <pre className={`p-4 rounded-xl text-sm font-mono overflow-auto max-h-80 whitespace-pre-wrap break-all border ${
                  isDark ? 'bg-black/40 border-white/[0.06] text-white/70' : 'bg-gray-950 border-gray-800 text-gray-300'
                }`}>
                  {generateChangelogPopupCode()}
                </pre>
                <button
                  onClick={() => handleCopy(generateChangelogPopupCode())}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark"
                >
                  {copied ? <><CheckIcon className="w-3.5 h-3.5" /> Copied</> : <><CopyIcon className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </FormField>
            <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
              Add this code to your website&apos;s HTML, preferably before the closing &lt;/body&gt; tag. Customize colors and sizes in the Settings above.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Code Modal: Changelog Dropdown ───────────────────────────────────── */}
      <Dialog open={showCode === 'changelog-dropdown'} onOpenChange={(open) => !open && setShowCode(null)}>
        <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
          isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
        }`}>
          <DialogHeader>
            <DialogTitle className={`text-lg font-display font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
              Embed Changelog Dropdown Widget
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Embed Code" isDark={isDark}>
              <div className="relative">
                <pre className={`p-4 rounded-xl text-sm font-mono overflow-auto max-h-80 whitespace-pre-wrap break-all border ${
                  isDark ? 'bg-black/40 border-white/[0.06] text-white/70' : 'bg-gray-950 border-gray-800 text-gray-300'
                }`}>
                  {generateChangelogDropdownCode()}
                </pre>
                <button
                  onClick={() => handleCopy(generateChangelogDropdownCode())}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark"
                >
                  {copied ? <><CheckIcon className="w-3.5 h-3.5" /> Copied</> : <><CopyIcon className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </FormField>
            <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
              Add this code to your website&apos;s HTML. Customize the button style in the code.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Code Modal: Announcement ─────────────────────────────────────────── */}
      <Dialog open={showCode === 'announcement'} onOpenChange={(open) => !open && setShowCode(null)}>
        <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
          isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
        }`}>
          <DialogHeader>
            <DialogTitle className={`text-lg font-display font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
              Embed Announcement Banner
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Embed Code" isDark={isDark}>
              <div className="relative">
                <pre className={`p-4 rounded-xl text-sm font-mono overflow-auto max-h-96 whitespace-pre-wrap break-all border ${
                  isDark ? 'bg-black/40 border-white/[0.06] text-white/70' : 'bg-gray-950 border-gray-800 text-gray-300'
                }`}>
                  {generateAnnouncementCode()}
                </pre>
                <button
                  onClick={() => handleCopy(generateAnnouncementCode())}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark"
                >
                  {copied ? <><CheckIcon className="w-3.5 h-3.5" /> Copied</> : <><CopyIcon className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </FormField>
            <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
              Add this HTML to your hero section. All customization options are commented in the code.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Code Modal: All-in-One ───────────────────────────────────────────── */}
      <Dialog open={showCode === 'all-in-one'} onOpenChange={(open) => !open && setShowCode(null)}>
        <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
          isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
        }`}>
          <DialogHeader>
            <DialogTitle className={`text-lg font-display font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
              Embed All-in-One Widget
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Widget Type</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewVariant('popover')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    previewVariant === 'popover'
                      ? 'bg-kelo-yellow text-kelo-ink'
                      : isDark
                        ? 'border border-white/[0.08] text-white/60 hover:bg-white/[0.06]'
                        : 'border border-kelo-border text-kelo-muted hover:bg-kelo-surface'
                  }`}
                >
                  Popover
                </button>
                <button
                  onClick={() => setPreviewVariant('popup')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    previewVariant === 'popup'
                      ? 'bg-kelo-yellow text-kelo-ink'
                      : isDark
                        ? 'border border-white/[0.08] text-white/60 hover:bg-white/[0.06]'
                        : 'border border-kelo-border text-kelo-muted hover:bg-kelo-surface'
                  }`}
                >
                  Pop-up
                </button>
              </div>
              <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                {previewVariant === 'popover'
                  ? 'Shows a side-positioned panel with feedback board and changelog'
                  : 'Shows a centered modal with feedback board and changelog'}
              </p>
            </div>

            <FormField label="Embed Code" isDark={isDark}>
              <div className="relative">
                <pre className={`p-4 rounded-xl text-sm font-mono overflow-auto max-h-80 whitespace-pre-wrap break-all border ${
                  isDark ? 'bg-black/40 border-white/[0.06] text-white/70' : 'bg-gray-950 border-gray-800 text-gray-300'
                }`}>
                  {generateAllInOneCode(previewVariant === 'popup' ? 'popup' : 'popover')}
                </pre>
                <button
                  onClick={() => handleCopy(generateAllInOneCode(previewVariant === 'popup' ? 'popup' : 'popover'))}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark"
                >
                  {copied ? <><CheckIcon className="w-3.5 h-3.5" /> Copied</> : <><CopyIcon className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </FormField>
            <p className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
              Add this code to your website&apos;s HTML. Customize settings in the Settings modal above.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
