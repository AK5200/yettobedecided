'use client'

interface WidgetSettingsFormProps {
  orgId: string
  initialSettings: {
    widget_type: string
    position: string
    accent_color: string
    button_text: string
    show_branding: boolean
    theme: string
  }
}

export function WidgetSettingsForm({ orgId, initialSettings }: WidgetSettingsFormProps) {
  return (
    <div className="text-sm text-gray-600">
      Widget settings form will load here for org {orgId}.
    </div>
  )
}
