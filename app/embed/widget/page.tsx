'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { WidgetContainer } from '@/components/widgets/widget-container'

function WidgetContent() {
  const searchParams = useSearchParams()
  const org = searchParams.get('org')

  if (!org) {
    return <div className="p-4 text-sm">Missing org parameter.</div>
  }

  return <WidgetContainer orgSlug={org} />
}

export default function WidgetEmbedPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Loading widget...</div>}>
      <WidgetContent />
    </Suspense>
  )
}
