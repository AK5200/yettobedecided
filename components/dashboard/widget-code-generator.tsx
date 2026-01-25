'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WidgetCodeGeneratorProps {
  orgSlug: string
  baseUrl: string
}

export function WidgetCodeGenerator({ orgSlug, baseUrl }: WidgetCodeGeneratorProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const scriptCode = `<script src="${baseUrl}/widget.js" data-org="${orgSlug}"></script>`
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
