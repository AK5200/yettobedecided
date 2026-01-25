'use client'

import { useEffect, useState } from 'react'
import { ChangelogPopup } from './changelog-popup'
import { FeedbackWidget } from './feedback-widget'
import { AllInOneWidget } from './all-in-one-widget'
import { FloatingButton } from './floating-button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface WidgetSettings {
  widget_type: 'changelog' | 'feedback' | 'all-in-one'
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  accent_color: string
  button_text: string
  show_branding: boolean
  theme: 'light' | 'dark' | 'auto'
}

interface WidgetContainerProps {
  orgSlug: string
  apiUrl?: string
}

export function WidgetContainer({ orgSlug, apiUrl }: WidgetContainerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<WidgetSettings | null>(null)
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([])
  const [changelog, setChangelog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWidgetData = async () => {
      setLoading(true)
      const baseUrl = apiUrl || window.location.origin
      const response = await fetch(`${baseUrl}/api/widget?org=${orgSlug}`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setBoards(data.boards || [])
        setChangelog(data.changelog || [])
      }
      setLoading(false)
    }

    fetchWidgetData()
  }, [apiUrl, orgSlug])

  if (loading || !settings) {
    return null
  }

  const accentColor = settings.accent_color

  return (
    <>
      <FloatingButton
        position={settings.position}
        text={settings.button_text}
        accentColor={accentColor}
        onClick={() => setIsOpen(true)}
      />

      {settings.widget_type === 'changelog' && (
        <ChangelogPopup
          entries={changelog}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          accentColor={accentColor}
          showBranding={settings.show_branding}
        />
      )}

      {settings.widget_type === 'feedback' && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md">
            <FeedbackWidget
              boards={boards}
              orgSlug={orgSlug}
              accentColor={accentColor}
              showBranding={settings.show_branding}
            />
          </DialogContent>
        </Dialog>
      )}

      {settings.widget_type === 'all-in-one' && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md">
            <AllInOneWidget
              boards={boards}
              changelog={changelog}
              orgSlug={orgSlug}
              accentColor={accentColor}
              showBranding={settings.show_branding}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
