'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Code, Copy, Check, ExternalLink, ArrowRight, ArrowLeft, Globe, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface StepWidgetProps {
  orgSlug: string
  onComplete: () => void
  onBack: () => void
}

export function StepWidget({ orgSlug, onComplete, onBack }: StepWidgetProps) {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : ''
  const feedbackUrl = `${baseUrl}/${orgSlug}/features`

  const embedCode = `<script
  src="${baseUrl}/embed.js"
  data-org="${orgSlug}"
  data-widget="all-in-one"
  data-trigger="popup"
  async
></script>`

  const copyToClipboard = async (text: string, type: 'url' | 'code') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'url') {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      }
    } catch {
      // Fallback
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center mx-auto mb-4">
          <Code className="h-6 w-6 text-violet-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Add to your website</h2>
        <p className="text-sm text-gray-400 mt-1.5">
          Choose how your users will access the feedback board.
        </p>
      </div>

      {/* Option 1: Direct Link */}
      <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
            <Globe className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Share a link</h3>
          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-1.5 py-0.5 rounded">Easiest</span>
        </div>
        <p className="text-xs text-gray-400">
          Share this URL directly or add it to your app&apos;s navigation.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 truncate">
            {feedbackUrl}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(feedbackUrl, 'url')}
            className="shrink-0 h-9 px-2.5"
          >
            {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Option 2: Embed Widget */}
      <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Embed widget</h3>
          <span className="text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200/60 px-1.5 py-0.5 rounded">Recommended</span>
        </div>
        <p className="text-xs text-gray-400">
          Add before the closing <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">&lt;/body&gt;</code> tag on your website.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-300 rounded-lg p-3.5 text-[11px] overflow-x-auto font-mono leading-relaxed">
            {embedCode}
          </pre>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(embedCode, 'code')}
            className="absolute top-1.5 right-1.5 h-7 px-2 text-gray-500 hover:text-white hover:bg-gray-700"
          >
            {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Docs Link */}
      <div className="text-center">
        <Link
          href="/widgets/docs"
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
        >
          View full documentation
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-5 rounded-xl text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onComplete}
          className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
