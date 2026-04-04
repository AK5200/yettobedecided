'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChangelogDropdown } from '@/components/widgets/changelog-dropdown'
import { applyWidgetTheme, getWidgetAccent } from '@/lib/widget-theme'

function DropdownContent() {
  const searchParams = useSearchParams()
  const org = searchParams.get('org') || ''
  const [settings, setSettings] = useState<any>(null)
  const detectedAccent = getWidgetAccent()
  const autoTheme = searchParams.get('theme') !== null

  useEffect(() => { applyWidgetTheme() }, [])

  // Listen for data from parent widget.js
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'kelo:data') {
        setSettings(event.data.data?.settings || {})
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Fallback: fetch if not received via postMessage within 1s
  useEffect(() => {
    if (!org) return
    const timer = setTimeout(() => {
      if (settings) return
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      fetch(`${baseUrl}/api/widget?org=${encodeURIComponent(org)}`)
        .then(res => res.json())
        .then(data => setSettings(data.settings || {}))
        .catch(() => setSettings({}))
    }, 1000)
    return () => clearTimeout(timer)
  }, [org, settings])

  if (!settings) return null

  return (
    <ChangelogDropdown
      orgSlug={org}
      accentColor={detectedAccent || settings.accent_color || '#000'}
      backgroundColor={autoTheme ? undefined : (settings.background_color || '#ffffff')}
      showBranding={settings.show_branding !== false}
    />
  )
}

export default function ChangelogDropdownPage() {
  return (
    <Suspense fallback={<div />}>
      <DropdownContent />
    </Suspense>
  )
}
