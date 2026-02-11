'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnnouncementBar } from '@/components/widgets/announcement-bar'

function BarContent() {
  const searchParams = useSearchParams()
  const org = searchParams.get('org') || ''
  const link = searchParams.get('link') || ''
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
    <AnnouncementBar
      orgSlug={org}
      link={link}
      accentColor={settings.accent_color || '#000'}
    />
  )
}

export default function AnnouncementBarPage() {
  return (
    <Suspense fallback={<div />}>
      <BarContent />
    </Suspense>
  )
}
