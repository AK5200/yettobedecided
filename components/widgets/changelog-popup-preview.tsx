'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import type { WidgetSettings } from '@/app/(dashboard)/widgets/page'

interface ChangelogEntry {
  id: string
  title: string
  content: string
  category: string
  published_at: string | null
  is_published: boolean
  image_url?: string
}

interface ChangelogPopupPreviewProps {
  orgId: string
  orgSlug: string
  onClose: () => void
  settings: WidgetSettings
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getCategoryStyle(category: string): { bg: string; text: string } {
  switch (category) {
    case 'feature':
      return { bg: 'bg-green-100', text: 'text-green-700' }
    case 'improvement':
      return { bg: 'bg-blue-100', text: 'text-blue-700' }
    case 'fix':
      return { bg: 'bg-orange-100', text: 'text-orange-700' }
    case 'announcement':
      return { bg: 'bg-purple-100', text: 'text-purple-700' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' }
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'feature':
      return 'New'
    case 'improvement':
      return 'Improved'
    case 'fix':
      return 'Fix'
    case 'announcement':
      return 'Announcement'
    default:
      return category
  }
}

function getSizeStyle(size: WidgetSettings['size']): string {
  switch (size) {
    case 'small':
      return '480px'
    case 'medium':
      return '560px'
    case 'large':
      return '680px'
    case 'xlarge':
      return '780px'
    default:
      return '680px'
  }
}

function getBorderRadiusStyle(radius: WidgetSettings['borderRadius']): string {
  switch (radius) {
    case 'none':
      return '0px'
    case 'small':
      return '8px'
    case 'medium':
      return '12px'
    case 'large':
      return '16px'
    default:
      return '12px'
  }
}

function getShadowStyle(shadow: WidgetSettings['shadow']): string {
  switch (shadow) {
    case 'none':
      return 'none'
    case 'small':
      return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    case 'medium':
      return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    case 'large':
      return '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    default:
      return '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  }
}

const mockEntries: ChangelogEntry[] = [
  {
    id: '1',
    title: 'User Segmentation',
    content: `Enable moderation today in your dashboard settings to build a better community experience. With our new user segmentation feature, you can now target specific user groups with personalized messages, track engagement metrics, and create custom workflows based on user behavior patterns. This powerful tool helps you understand your audience better and deliver more relevant content to each segment.`,
    category: 'feature',
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
  },
  {
    id: '2',
    title: 'Dark Mode Support',
    content: `We've added a beautiful dark mode to reduce eye strain during late-night work sessions. Toggle between light and dark themes in your settings, or let it follow your system preference automatically. The dark theme has been carefully designed to maintain readability while reducing blue light exposure. All charts, graphs, and UI elements have been optimized for the dark color scheme.`,
    category: 'feature',
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
  },
  {
    id: '3',
    title: 'Performance Improvements',
    content: `We've optimized our backend infrastructure for faster load times. Pages now load 40% faster with improved caching and optimized database queries. Our engineering team has worked tirelessly to identify and eliminate bottlenecks across the entire application stack, resulting in a significantly smoother user experience.`,
    category: 'improvement',
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
  {
    id: '4',
    title: 'Fixed Export Bug',
    content: `Resolved an issue where CSV exports would sometimes fail for large datasets. The export feature now handles datasets of any size reliably. We've also added progress indicators for large exports so you can track the status in real-time.`,
    category: 'fix',
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
]

export function ChangelogPopupPreview({ orgId, orgSlug, onClose, settings }: ChangelogPopupPreviewProps) {
  const entries = mockEntries

  const maxWidth = getSizeStyle(settings.size)
  const borderRadius = getBorderRadiusStyle(settings.borderRadius)
  const boxShadow = getShadowStyle(settings.shadow)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full mx-4 max-h-[80vh] flex flex-col"
        style={{
          maxWidth,
          borderRadius,
          boxShadow,
          backgroundColor: settings.backgroundColor,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 widget-scrollbar">
          {/* Header */}
          <div className="pt-6 pb-4">
            <h2 className="text-2xl font-semibold">{settings.heading}</h2>
            <p className="text-gray-500 mt-1">{settings.subheading}</p>
          </div>

          {/* Entries */}
          <div className="space-y-6 pb-4">
            {entries.map((entry) => {
              return (
                <div key={entry.id} className="pb-6 last:pb-0">
                  {entry.image_url && (
                    <img
                      src={entry.image_url}
                      alt={entry.title}
                      className="w-full h-72 object-cover rounded-2xl mb-4"
                    />
                  )}
                  <h3 className="font-semibold text-gray-900 text-xl mb-2">{entry.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{entry.content}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 border-t flex items-center justify-between"
          style={{ borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius }}
        >
          {settings.showBranding ? (
            <span className="text-xs text-gray-400">Powered by FeedbackHub</span>
          ) : (
            <span />
          )}
          <Link
            href={`/${orgSlug}/changelog`}
            className="text-xs font-medium hover:underline"
            style={{ color: settings.accentColor }}
            onClick={onClose}
          >
            View all updates
          </Link>
        </div>
      </div>
    </div>
  )
}
