'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WidgetCodeGeneratorProps {
  orgSlug: string
  baseUrl: string
}

export function WidgetCodeGenerator({ orgSlug, baseUrl }: WidgetCodeGeneratorProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [widgetType, setWidgetType] = useState<string>('floating')

  useEffect(() => {
    // Fetch widget settings to get the widget type
    fetch('/api/widget-settings')
      .then(res => res.json())
      .then(data => {
        if (data.widget_type) {
          setWidgetType(data.widget_type)
        }
      })
      .catch(() => {
        // Default to floating if fetch fails
        setWidgetType('floating')
      })
  }, [])

  const getScriptName = () => {
    if (widgetType === 'popup') return 'changelog-popup.js'
    if (widgetType === 'announcement') return 'announcement-bar.js'
    return 'widget.js'
  }

  const scriptCode = `<script src="${baseUrl}/${getScriptName()}" data-org="${orgSlug}"></script>`
  const iframeCode = `<iframe src="${baseUrl}/embed/widget?org=${orgSlug}" width="420" height="640"></iframe>`

  const copyToClipboard = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <Tabs defaultValue="script">
      <TabsList>
        <TabsTrigger value="script">Script Tag</TabsTrigger>
        <TabsTrigger value="iframe">iFrame</TabsTrigger>
      </TabsList>
      <TabsContent value="script" className="space-y-2">
        <pre className="text-xs bg-gray-50 p-3 rounded border">{scriptCode}</pre>
        <Button onClick={() => copyToClipboard(scriptCode, 'script')} variant="outline">
          {copied === 'script' ? 'Copied' : 'Copy'}
        </Button>
      </TabsContent>
      <TabsContent value="iframe" className="space-y-2">
        <pre className="text-xs bg-gray-50 p-3 rounded border">{iframeCode}</pre>
        <Button onClick={() => copyToClipboard(iframeCode, 'iframe')} variant="outline">
          {copied === 'iframe' ? 'Copied' : 'Copy'}
        </Button>
      </TabsContent>
      <p className="text-xs text-gray-500 mt-3">
        Use the script tag for the full widget, or the iframe if you need manual sizing.
      </p>
    </Tabs>
  )
}
