'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChangelogDropdown } from '@/components/widgets/changelog-dropdown'
import { applyWidgetTheme, getWidgetAccent, getEmbeddedWidgetData } from '@/lib/widget-theme'

const _embeddedData = getEmbeddedWidgetData()

function DropdownContent() {
  const searchParams = useSearchParams()
  const org = searchParams.get('org') || ''
  const [settings, setSettings] = useState<any>(_embeddedData?.settings || null)
  const detectedAccent = getWidgetAccent()
  const autoTheme = searchParams.get('theme') !== null
  const autoOverride = autoTheme || detectedAccent !== null

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

  // Fallback: fetch if no data from embedded or postMessage within 1s
  useEffect(() => {
    if (!org || settings) return
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
      backgroundColor={autoOverride ? undefined : (settings.background_color || '#ffffff')}
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
