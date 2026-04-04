'use client'

import { useEffect, useState } from 'react'
import { FeedbackWidget } from './feedback-widget'
import { AllInOneWidget } from './all-in-one-widget'
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
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'kelo:data') {
        const data = event.data.data
        if (data) {
          setSettings(data.settings)
          setBoards(data.boards || [])
          setChangelog(data.changelog || [])
          setLoading(false)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Fallback: fetch if not received via postMessage within 1s
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (settings) return
      const baseUrl = apiUrl || window.location.origin
      try {
        const response = await fetch(`${baseUrl}/api/widget?org=${encodeURIComponent(orgSlug)}`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings)
          setBoards(data.boards || [])
          setChangelog(data.changelog || [])
        }
      } catch (error) {
        console.error('Failed to fetch widget data:', error)
      } finally {
        setLoading(false)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [apiUrl, orgSlug, settings])

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
      <div className="w-full min-h-screen flex items-center justify-center bg-background" style={{ pointerEvents: 'auto' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const accentColor = settings.accent_color

  const handleClose = () => {
    setIsOpen(false)
    window.parent.postMessage('kelo:close', '*')
  }

  return (
    <div className="w-full min-h-screen bg-background" style={{ pointerEvents: 'auto' }}>
      {settings.widget_type === 'feedback' && isOpen && (
        <div className="w-full min-h-screen bg-background p-6" style={{ pointerEvents: 'auto' }}>
          <div className="max-w-2xl mx-auto relative">
            <button
              onClick={handleClose}
              className="absolute top-0 right-0 p-2 hover:bg-muted rounded-full transition-colors z-10"
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
            window.parent.postMessage('kelo:close', '*')
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
