'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChangelogPreviewProps {
  title: string
  content: string
  category: string
  open: boolean
  onClose: () => void
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  feature: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  improvement: { bg: 'bg-blue-100', text: 'text-blue-700' },
  fix: { bg: 'bg-orange-100', text: 'text-orange-700' },
  announcement: { bg: 'bg-purple-100', text: 'text-purple-700' },
}

export function ChangelogPreview({ title, content, category, open, onClose }: ChangelogPreviewProps) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.announcement

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Preview</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text} capitalize`}>
              {category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <div
            className="prose prose-lg max-w-none break-words overflow-wrap-anywhere [&_img]:max-w-full [&_img]:h-auto [&_video]:max-w-full [&_video]:h-auto [&_*]:max-w-full"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              '--tw-prose-body': '#374151',
              '--tw-prose-headings': '#111827',
              '--tw-prose-links': '#f59e0b',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: '100%',
            } as React.CSSProperties}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
