'use client'

import { ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface ChangelogEntry {
  id: string
  title: string
  category: string
  published_at?: string | null
}

interface ChangelogDropdownProps {
  entries: ChangelogEntry[]
  trigger: ReactNode
  accentColor?: string
  showBranding?: boolean
}

export function ChangelogDropdown({
  entries,
  trigger,
  accentColor = '#000000',
  showBranding = true,
}: ChangelogDropdownProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto">
        <div className="font-semibold mb-3">Latest Updates</div>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="border-b pb-3 last:border-b-0">
              <div className="text-xs text-gray-500 mb-1">
                {entry.published_at
                  ? new Date(entry.published_at).toLocaleDateString()
                  : 'Recently'}
              </div>
              <div className="font-medium text-sm">{entry.title}</div>
              <Badge
                variant="outline"
                className="mt-2"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                {entry.category}
              </Badge>
            </div>
          ))}
        </div>
        {showBranding && (
          <div className="pt-3 text-xs text-gray-500 text-center">
            Powered by FeedbackHub
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
