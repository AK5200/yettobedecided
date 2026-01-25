'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FeedbackWidget } from './feedback-widget'

interface ChangelogEntry {
  id: string
  title: string
  content: string
  category: string
  published_at?: string | null
}

interface AllInOneWidgetProps {
  boards: { id: string; name: string }[]
  changelog: ChangelogEntry[]
  orgSlug: string
  accentColor?: string
  showBranding?: boolean
}

export function AllInOneWidget({
  boards,
  changelog,
  orgSlug,
  accentColor = '#000000',
  showBranding = true,
}: AllInOneWidgetProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">Have something to say?</div>
        <p className="text-sm text-gray-600">
          Share feedback or check our latest updates
        </p>
      </div>
      <Tabs defaultValue="feedback">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>
        <TabsContent value="feedback" className="pt-4">
          <FeedbackWidget
            boards={boards}
            orgSlug={orgSlug}
            accentColor={accentColor}
            showBranding={showBranding}
          />
        </TabsContent>
        <TabsContent value="changelog" className="pt-4">
          <div className="max-h-80 overflow-y-auto space-y-4">
            {changelog.map((entry) => (
              <div key={entry.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Badge variant="outline">{entry.category}</Badge>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
