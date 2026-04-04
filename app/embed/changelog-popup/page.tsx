'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChangelogPopup } from '@/components/widgets/changelog-popup'
import { applyWidgetTheme, getWidgetAccent, getEmbeddedWidgetData } from '@/lib/widget-theme'

const _embeddedData = getEmbeddedWidgetData()

function PopupContent() {
  const searchParams = useSearchParams()
  const org = searchParams.get('org') || ''
  const [settings, setSettings] = useState<any>(_embeddedData?.settings || null)
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

  // Fallback: fetch if not received via postMessage or embedded data within 1s
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
