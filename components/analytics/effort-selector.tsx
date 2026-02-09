'use client'

import { useState } from 'react'

interface EffortSelectorProps {
  postId: string
  currentEffort: 'low' | 'medium' | 'high' | null
  onUpdate?: (effort: string) => void
}

const EFFORT_CONFIG = {
  low: { label: 'Low', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
  medium: { label: 'Med', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
  high: { label: 'High', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
}

export function EffortSelector({ postId, currentEffort, onUpdate }: EffortSelectorProps) {
  const [effort, setEffort] = useState(currentEffort)
  const [loading, setLoading] = useState(false)

  const handleClick = async (newEffort: 'low' | 'medium' | 'high' | null) => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch('/api/analytics/prioritization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, effort: newEffort }),
      })

      if (res.ok) {
        setEffort(newEffort)
        onUpdate?.(newEffort || '')
      }
    } catch (error) {
      console.error('Failed to update effort:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-1">
      {(['low', 'medium', 'high'] as const).map((level) => {
        const isSelected = effort === level
        const config = EFFORT_CONFIG[level]
        return (
          <button
            key={level}
            onClick={() => handleClick(level)}
            disabled={loading}
            className={`px-2 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
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
  )
}
