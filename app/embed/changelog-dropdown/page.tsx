'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChangelogDropdown } from '@/components/widgets/changelog-dropdown'

function DropdownContent() {
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
    <div className="p-2">
      <ChangelogDropdown
        orgSlug={org}
        accentColor={settings.accent_color || '#000'}
        backgroundColor={settings.background_color || '#ffffff'}
        borderRadius={settings.border_radius || 'medium'}
        showBranding={settings.show_branding !== false}
      />
    </div>
  )
}

export default function ChangelogDropdownPage() {
  return (
    <Suspense fallback={<div />}>
      <DropdownContent />
    </Suspense>
  )
}
