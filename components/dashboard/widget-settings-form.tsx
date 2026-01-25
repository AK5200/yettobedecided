'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

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
  const [widgetType, setWidgetType] = useState(initialSettings.widget_type)
  const [position, setPosition] = useState(initialSettings.position)
  const [accentColor, setAccentColor] = useState(initialSettings.accent_color)
  const [buttonText, setButtonText] = useState(initialSettings.button_text)
  const [showBranding, setShowBranding] = useState(initialSettings.show_branding)
  const [theme, setTheme] = useState(initialSettings.theme)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    const response = await fetch('/api/widget-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: orgId,
        widget_type: widgetType,
        position,
        accent_color: accentColor,
        button_text: buttonText,
        show_branding: showBranding,
        theme,
      }),
    })

    if (response.ok) {
      toast.success('Widget settings saved.')
    } else {
      toast.error('Unable to save widget settings.')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Widget Type</Label>
        <RadioGroup value={widgetType} onValueChange={setWidgetType}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="changelog" id="widget-changelog" />
            <Label htmlFor="widget-changelog">Changelog Only</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="feedback" id="widget-feedback" />
            <Label htmlFor="widget-feedback">Feedback Only</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="all-in-one" id="widget-all" />
            <Label htmlFor="widget-all">All-in-One</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Position</Label>
        <RadioGroup value={position} onValueChange={setPosition}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="bottom-right" id="pos-br" />
            <Label htmlFor="pos-br">Bottom Right</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="bottom-left" id="pos-bl" />
            <Label htmlFor="pos-bl">Bottom Left</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="top-right" id="pos-tr" />
            <Label htmlFor="pos-tr">Top Right</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="top-left" id="pos-tl" />
            <Label htmlFor="pos-tl">Top Left</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accent_color">Accent Color</Label>
        <Input
          id="accent_color"
          type="color"
          value={accentColor}
          onChange={(event) => setAccentColor(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="button_text">Button Text</Label>
        <Input
          id="button_text"
          value={buttonText}
          onChange={(event) => setButtonText(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Theme</Label>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger>
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="auto">Auto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="show_branding"
          checked={showBranding}
          onCheckedChange={(value) => setShowBranding(!!value)}
        />
        <Label htmlFor="show_branding">Show branding (free = always on)</Label>
      </div>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  )
}
