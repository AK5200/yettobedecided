'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface ChangelogEntry {
  id: string
  title: string
  content: string
  category: string
  published_at?: string | null
}

interface ChangelogPopupProps {
  entries: ChangelogEntry[]
  isOpen: boolean
  onClose: () => void
  accentColor?: string
  showBranding?: boolean
}

export function ChangelogPopup({
  entries,
  isOpen,
  onClose,
  accentColor = '#000000',
  showBranding = true,
}: ChangelogPopupProps) {
  useEffect(() => {
    if (!isOpen) {
      onClose()
    }
  }, [isOpen, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>What&apos;s New</DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-600 hover:text-black"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Badge
                  variant="outline"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  {entry.category}
                </Badge>
                <span>
                  {entry.published_at
                    ? new Date(entry.published_at).toLocaleDateString()
                    : 'Recently'}
                </span>
              </div>
              <div className="font-medium">{entry.title}</div>
              <p className="text-sm text-gray-600 line-clamp-3">{entry.content}</p>
            </div>
          ))}
        </div>
        {showBranding && (
          <div className="pt-4 text-xs text-gray-500 text-center">
            Powered by FeedbackHub
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
