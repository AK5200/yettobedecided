'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'open') setIsOpen(true)
      if (event.data === 'close') setIsOpen(false)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (loading || !settings) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white" style={{ pointerEvents: 'auto' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  const accentColor = settings.accent_color

  const handleClose = () => {
    setIsOpen(false)
    window.parent.postMessage('feedbackhub:close', '*')
  }

  return (
    <div className="w-full min-h-screen bg-white" style={{ pointerEvents: 'auto' }}>
      {!isOpen && (
        <FloatingButton
          position={settings.position}
          text={settings.button_text}
          accentColor={accentColor}
          onClick={() => setIsOpen(true)}
        />
      )}

      {settings.widget_type === 'feedback' && isOpen && (
        <div className="w-full min-h-screen bg-white p-6" style={{ pointerEvents: 'auto' }}>
          <div className="max-w-2xl mx-auto relative">
            <button
              onClick={handleClose}
              className="absolute top-0 right-0 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <FeedbackWidget
              boards={boards}
              orgSlug={orgSlug}
              accentColor={accentColor}
              showBranding={settings.show_branding}
            />
          </div>
        </div>
      )}

      {settings.widget_type === 'all-in-one' && (
        <Dialog open={isOpen} onOpenChange={(isOpen) => {
          setIsOpen(isOpen)
          if (!isOpen) {
            window.parent.postMessage('feedbackhub:close', '*')
          }
        }}>
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
    </div>
  )
}
