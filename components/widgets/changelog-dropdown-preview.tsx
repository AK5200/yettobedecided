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

interface ChangelogDropdownPreviewProps {
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

function getCategoryStyle(category: string): { bg: string; text: string; dot: string } {
  switch (category) {
    case 'feature':
      return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' }
    case 'improvement':
      return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' }
    case 'fix':
      return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' }
    case 'announcement':
      return { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' }
  }
}

function getWidthStyle(size: WidgetSettings['size']): string {
  switch (size) {
    case 'small':
      return '320px'
    case 'medium':
      return '380px'
    case 'large':
      return '440px'
    case 'xlarge':
      return '500px'
    default:
      return '440px'
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
    title: 'Dark Mode Support',
    content: `We've added a beautiful dark mode to reduce eye strain during late-night work sessions.`,
    category: 'feature',
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=120&fit=crop',
  },
  {
    id: '2',
    title: 'Performance Improvements',
    content: `Pages now load 40% faster with improved caching and optimized database queries.`,
    category: 'improvement',
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
  {
    id: '3',
    title: 'Fixed Export Bug',
    content: `Resolved an issue where CSV exports would sometimes fail for large datasets.`,
    category: 'fix',
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
  {
    id: '4',
    title: 'Team Workspaces',
    content: `Create team workspaces to collaborate with your colleagues seamlessly.`,
    category: 'feature',
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=120&fit=crop',
  },
  {
    id: '5',
    title: 'New API Endpoints',
    content: `Added new REST API endpoints for better integration with third-party services.`,
    category: 'feature',
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_published: true,
  },
]

export function ChangelogDropdownPreview({ orgId, orgSlug, onClose, settings }: ChangelogDropdownPreviewProps) {
  const entries = mockEntries

  const width = getWidthStyle(settings.size)
  const borderRadius = getBorderRadiusStyle(settings.borderRadius)
  const boxShadow = getShadowStyle(settings.shadow)

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Dropdown Panel - Right side */}
      <div
        className="absolute right-4 top-20 border max-h-[calc(100vh-120px)] flex flex-col"
        style={{
          width,
          borderRadius,
          boxShadow,
          backgroundColor: settings.backgroundColor,
        }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{settings.heading || "What's New"}</h3>
            {entries.length > 0 && (
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: settings.accentColor }}
              />
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y">
            {entries.map((entry) => {
              const categoryStyle = getCategoryStyle(entry.category)
              return (
                <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${categoryStyle.dot}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">{entry.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{entry.content}</p>
                      {entry.image_url && (
                        <img
                          src={entry.image_url}
                          alt={entry.title}
                          className="mt-2 w-full h-20 object-cover rounded"
                        />
                      )}
                      <span className="text-xs text-gray-400 mt-2 block">
                        {formatDate(entry.published_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-3 py-2 border-t flex items-center justify-between"
          style={{
            borderBottomLeftRadius: borderRadius,
            borderBottomRightRadius: borderRadius,
            backgroundColor: settings.backgroundColor,
          }}
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
            View all
          </Link>
        </div>
      </div>
    </div>
  )
}
