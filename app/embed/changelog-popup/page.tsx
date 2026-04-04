'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChangelogPopup } from '@/components/widgets/changelog-popup'
import { applyWidgetTheme, getWidgetAccent } from '@/lib/widget-theme'

function PopupContent() {
  const searchParams = useSearchParams()
  const org = searchParams.get('org') || ''
  const [settings, setSettings] = useState<any>(null)
  const detectedAccent = getWidgetAccent()
  const autoTheme = searchParams.get('theme') !== null

  useEffect(() => { applyWidgetTheme() }, [])

  useEffect(() => {
    if (!org) return
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    fetch(`${baseUrl}/api/widget?org=${encodeURIComponent(org)}`)
      .then(res => res.json())
      .then(data => {
        setSettings(data.settings || {})
      })
      .catch(() => setSettings({}))
  }, [org])

  if (!settings) return null

  return (
    <ChangelogPopup
      orgSlug={org}
      accentColor={detectedAccent || settings.accent_color || '#000'}
      backgroundColor={autoTheme ? undefined : (settings.background_color || '#ffffff')}
      headerBackgroundColor={autoTheme ? undefined : (settings.header_background_color || settings.background_color || '#ffffff')}
      showBranding={settings.show_branding !== false}
      heading={settings.heading || 'Welcome back 👋'}
      subheading={settings.subheading || "Here's what we added while you were away."}
    />
  )
}

export default function ChangelogPopupPage() {
  return (
    <Suspense fallback={<div />}>
      <PopupContent />
    </Suspense>
  )
}
