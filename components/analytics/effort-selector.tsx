'use client'

import { useState } from 'react'

interface EffortSelectorProps {
  postId: string
  currentEffort: 'low' | 'medium' | 'high' | null
  currentTime?: 'easy' | 'mid' | 'high' | null
  onUpdate?: () => void
}

const EFFORT_CONFIG = {
  low: { label: 'Low', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
  medium: { label: 'Med', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
  high: { label: 'High', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
}

const TIME_CONFIG = {
  easy: { label: 'Easy', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
  mid: { label: 'Mid', color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200' },
  high: { label: 'High', color: 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200' },
}

export function EffortSelector({ postId, currentEffort, currentTime, onUpdate }: EffortSelectorProps) {
  const [effort, setEffort] = useState(currentEffort)
  const [time, setTime] = useState(currentTime)
  const [loading, setLoading] = useState(false)

  const handleEffortClick = async (newEffort: 'low' | 'medium' | 'high' | null) => {
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
        onUpdate?.()
      }
    } catch (error) {
      console.error('Failed to update effort:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeClick = async (newTime: 'easy' | 'mid' | 'high' | null) => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch('/api/analytics/prioritization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, time: newTime }),
      })

      if (res.ok) {
        setTime(newTime)
        onUpdate?.()
      }
    } catch (error) {
      console.error('Failed to update time:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Effort:</span>
        <div className="flex gap-1">
          {(['low', 'medium', 'high'] as const).map((level) => {
            const isSelected = effort === level
            const config = EFFORT_CONFIG[level]
            return (
              <button
                key={level}
                onClick={() => handleEffortClick(level)}
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
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Time:</span>
        <div className="flex gap-1">
          {(['easy', 'mid', 'high'] as const).map((level) => {
            const isSelected = time === level
            const config = TIME_CONFIG[level]
            return (
              <button
                key={level}
                onClick={() => handleTimeClick(level)}
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
      </div>
    </div>
  )
}
