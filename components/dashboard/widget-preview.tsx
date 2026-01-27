'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface WidgetPreviewProps {
  orgSlug: string
  refreshTrigger?: number
}

export function WidgetPreview({ orgSlug, refreshTrigger }: WidgetPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0 && iframeRef.current) {
      iframeRef.current.src = `/embed/widget?org=${orgSlug}&t=${Date.now()}`
      setRefreshKey(prev => prev + 1)
    }
  }, [refreshTrigger, orgSlug])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    if (iframeRef.current) {
      iframeRef.current.src = `/embed/widget?org=${orgSlug}&t=${Date.now()}`
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          This is how your widget will appear on your website
        </p>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Preview
        </Button>
      </div>
      <div className="border rounded overflow-hidden">
        <iframe
          key={refreshKey}
          ref={iframeRef}
          src={`/embed/widget?org=${orgSlug}&t=${Date.now()}`}
          className="w-full h-[500px]"
          title="Widget preview"
        />
      </div>
    </div>
  )
}
