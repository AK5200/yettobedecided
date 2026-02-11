'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChangelogPopup } from '@/components/widgets/changelog-popup'

function PopupContent() {
  const searchParams = useSearchParams()
  const org = searchParams.get('org') || ''
  const [settings, setSettings] = useState<any>(null)

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
      accentColor={settings.accent_color || '#000'}
      backgroundColor={settings.background_color || '#ffffff'}
      borderRadius={settings.border_radius || 'medium'}
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
