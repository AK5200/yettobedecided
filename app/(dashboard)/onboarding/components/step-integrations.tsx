'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, ExternalLink, Check, Plug } from 'lucide-react'

interface StepIntegrationsProps {
  onComplete: () => void
  onBack: () => void
}

export function StepIntegrations({ onComplete, onBack }: StepIntegrationsProps) {
  const [slackConnected, setSlackConnected] = useState(false)
  const [linearConnected, setLinearConnected] = useState(false)

  useEffect(() => {
    const checkIntegrations = async () => {
      try {
        const res = await fetch('/api/integrations')
        if (res.ok) {
          const data = await res.json()
          if (data.integrations) {
            setSlackConnected(data.integrations.some((i: any) => i.type === 'slack' && i.is_active))
          }
          if (data.linear) {
            setLinearConnected(!!data.linear.access_token)
          }
        }
      } catch {
        // Ignore
      }
    }
    checkIntegrations()
  }, [])

  const handleSlack = () => {
    window.open('/api/auth/slack', '_blank')
  }

  const handleLinear = async () => {
    try {
      const res = await fetch('/api/integrations')
      if (res.ok) {
        const data = await res.json()
        if (data.linearAuthUrl) {
          window.open(data.linearAuthUrl, '_blank')
        }
      }
    } catch {
      // Fallback
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mx-auto mb-4">
          <Plug className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Connect integrations</h2>
        <p className="text-sm text-gray-400 mt-1.5">
          Get notified about new feedback in the tools you already use.
        </p>
        <p className="text-xs text-gray-300 mt-1">Optional — you can set this up later.</p>
      </div>

      <div className="space-y-2.5">
        {/* Slack */}
        <div className={`flex items-center gap-4 p-4 border rounded-xl transition-all ${slackConnected ? 'bg-emerald-50/30 border-emerald-200/60' : 'bg-gray-50/50 border-gray-100'}`}>
          <div className="w-10 h-10 rounded-lg bg-[#4A154B]/10 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#4A154B"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">Slack</h3>
              {slackConnected && (
                <span className="text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Check className="h-2.5 w-2.5" />
                  Connected
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Get notified of new feedback in Slack.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSlack}
            disabled={slackConnected}
            className="shrink-0 h-8 text-xs rounded-lg"
          >
            {slackConnected ? 'Connected' : 'Connect'}
            {!slackConnected && <ExternalLink className="h-3 w-3 ml-1" />}
          </Button>
        </div>

        {/* Linear */}
        <div className={`flex items-center gap-4 p-4 border rounded-xl transition-all ${linearConnected ? 'bg-emerald-50/30 border-emerald-200/60' : 'bg-gray-50/50 border-gray-100'}`}>
          <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M2.83 17.52a.5.5 0 0 1-.08-.65l14.5-19.5A.5.5 0 0 1 18 17.5H3.5a.5.5 0 0 1-.35-.15l-.32-.33zM22.3 14.24a.5.5 0 0 0 .2-.63A10 10 0 0 0 10.39 1.5a.5.5 0 0 0-.22.84l12.13 11.9z" fill="#5E6AD2"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">Linear</h3>
              {linearConnected && (
                <span className="text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Check className="h-2.5 w-2.5" />
                  Connected
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Sync feedback to Linear issues.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLinear}
            disabled={linearConnected}
            className="shrink-0 h-8 text-xs rounded-lg"
          >
            {linearConnected ? 'Connected' : 'Connect'}
            {!linearConnected && <ExternalLink className="h-3 w-3 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
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
          {slackConnected || linearConnected ? 'Continue' : 'Skip for now'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
