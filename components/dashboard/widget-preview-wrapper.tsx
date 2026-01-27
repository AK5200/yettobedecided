'use client'

import { useState } from 'react'
import { WidgetSettingsForm } from './widget-settings-form'
import { WidgetPreview } from './widget-preview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WidgetPreviewWrapperProps {
  orgId: string
  orgSlug: string
  initialSettings: {
    widget_type: string
    position: string
    accent_color: string
    button_text: string
    show_branding: boolean
    theme: string
  }
}

export function WidgetPreviewWrapper({ orgId, orgSlug, initialSettings }: WidgetPreviewWrapperProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSave = () => {
    // Trigger preview refresh
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <WidgetSettingsForm orgId={orgId} initialSettings={initialSettings} onSave={handleSave} />
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <WidgetPreview orgSlug={orgSlug} refreshTrigger={refreshTrigger} />
        </CardContent>
      </Card>
    </div>
  )
}
