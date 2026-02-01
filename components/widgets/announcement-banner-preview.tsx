'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { AnnouncementSettings } from '@/app/(dashboard)/widgets/page'

interface AnnouncementBannerPreviewProps {
  onClose: () => void
  settings: AnnouncementSettings
  orgSlug: string
  onOpenPopup: () => void
}

function getBorderRadiusStyle(radius: AnnouncementSettings['borderRadius']): string {
  switch (radius) {
    case 'none':
      return '0px'
    case 'small':
      return '8px'
    case 'medium':
      return '12px'
    case 'large':
      return '9999px' // Full pill
    default:
      return '9999px'
  }
}

function getLinkLabel(linkType: AnnouncementSettings['linkType']): string {
  switch (linkType) {
    case 'none':
      return 'No click action'
    case 'popup':
      return 'Click to open changelog popup'
    case 'changelog':
      return 'Click to go to changelog page'
    case 'custom':
      return 'Click to open custom URL'
    default:
      return ''
  }
}

export function AnnouncementBannerPreview({ onClose, settings, orgSlug, onOpenPopup }: AnnouncementBannerPreviewProps) {
  const router = useRouter()
  const borderRadius = getBorderRadiusStyle(settings.borderRadius)
  const isClickable = settings.linkType !== 'none'

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (settings.linkType === 'none') {
      return
    }

    if (settings.linkType === 'popup') {
      onOpenPopup()
    } else if (settings.linkType === 'changelog') {
      onClose()
      router.push(`/${orgSlug}/changelog`)
    } else if (settings.linkType === 'custom' && settings.customUrl) {
      window.open(settings.customUrl, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Preview Container - simulated hero section */}
      <div className="relative w-full max-w-2xl mx-4 p-12 rounded-xl bg-gray-50">
        {/* Simulated hero section */}
        <div className="text-center space-y-6">
          {/* Announcement Banner */}
          <div className="flex justify-center">
            {isClickable ? (
              <a
                href="#"
                onClick={handleClick}
                className="inline-flex items-center gap-2 px-4 py-2 border transition-all hover:shadow-md cursor-pointer"
                style={{
                  borderRadius,
                  borderColor: `${settings.accentColor}30`,
                  backgroundColor: settings.backgroundColor,
                }}
              >
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 text-white"
                  style={{
                    backgroundColor: settings.accentColor,
                    borderRadius,
                  }}
                >
                  {settings.tag || 'New'}
                </span>
                <span className="text-sm text-gray-700">
                  {settings.text || 'Capture feedback automatically with AI'} ✨
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </a>
            ) : (
              <span
                className="inline-flex items-center gap-2 px-4 py-2 border cursor-default"
                style={{
                  borderRadius,
                  borderColor: `${settings.accentColor}30`,
                  backgroundColor: settings.backgroundColor,
                }}
              >
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 text-white"
                  style={{
                    backgroundColor: settings.accentColor,
                    borderRadius,
                  }}
                >
                  {settings.tag || 'New'}
                </span>
                <span className="text-sm text-gray-700">
                  {settings.text || 'Capture feedback automatically with AI'} ✨
                </span>
              </span>
            )}
          </div>

          {/* Link type indicator */}
          <p className="text-xs text-gray-400">
            {getLinkLabel(settings.linkType)}
          </p>

          {/* Placeholder title */}
          <h1 className="text-4xl font-bold text-gray-900">
            Build better products with<br />customer feedback
          </h1>

          <p className="text-gray-500 max-w-md mx-auto">
            This is a preview of how the announcement banner will look in your hero section.
          </p>
        </div>

        {/* Close hint */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Click outside to close preview
        </p>
      </div>
    </div>
  )
}
