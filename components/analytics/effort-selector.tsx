'use client'

import { useState } from 'react'

interface EffortSelectorProps {
  postId: string
  currentEffort: 'low' | 'medium' | 'high' | null
  currentTime?: 'low' | 'medium' | 'high' | null
  currentImpact?: 'low' | 'medium' | 'high' | null
  onUpdate?: () => void
  compact?: boolean
}

const LEVEL_CONFIG = {
  low: { label: 'Low', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
  medium: { label: 'Med', color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  high: { label: 'High', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
}

const LEVELS = ['low', 'medium', 'high'] as const

export function EffortSelector({
  postId,
  currentEffort,
  currentTime,
  currentImpact,
  onUpdate,
  compact = false,
}: EffortSelectorProps) {
  const [values, setValues] = useState({
    impact: currentImpact || null,
    effort: currentEffort || null,
    time: currentTime || null,
  })
  const [loading, setLoading] = useState(false)

  const handleClick = async (dimension: 'impact' | 'effort' | 'time', value: 'low' | 'medium' | 'high') => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch('/api/analytics/prioritization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, [dimension]: value }),
      })

      if (res.ok) {
        setValues((prev) => ({ ...prev, [dimension]: value }))
        onUpdate?.()
      }
    } catch (error) {
      console.error(`Failed to update ${dimension}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const dimensions = [
    { key: 'impact' as const, label: 'Impact' },
    { key: 'effort' as const, label: 'Effort' },
    { key: 'time' as const, label: 'Time' },
  ]

  return (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
      {dimensions.map((dim) => (
        <div key={dim.key} className="flex items-center gap-2">
          <span className={`${compact ? 'text-[10px] w-10' : 'text-xs w-12'} font-medium text-gray-500`}>
            {dim.label}:
          </span>
          <div className="flex gap-1">
            {LEVELS.map((level) => {
              const isSelected = values[dim.key] === level
              const config = LEVEL_CONFIG[level]
              return (
                <button
                  key={level}
                  onClick={() => handleClick(dim.key, level)}
                  disabled={loading}
                  className={`${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} font-medium rounded border transition-colors cursor-pointer ${
                    isSelected
                      ? config.color
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
