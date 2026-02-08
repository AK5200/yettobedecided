'use client'

import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface ComparisonBadgeProps {
  current: number
  previous: number
  label?: string
}

export function ComparisonBadge({
  current,
  previous,
  label = 'vs last period',
}: ComparisonBadgeProps) {
  const diff = previous > 0 ? ((current - previous) / previous) * 100 : 0
  const isPositive = diff > 0
  const isNeutral = diff === 0
  const formatted = Math.abs(diff).toFixed(0)

  return (
    <div
      className={`flex items-center gap-1 text-xs font-medium ${
        isPositive
          ? 'text-green-600'
          : isNeutral
            ? 'text-gray-500'
            : 'text-red-600'
      }`}
    >
      {isPositive ? (
        <ArrowUp className="h-3 w-3" />
      ) : isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      <span>
        {formatted}% {label}
      </span>
    </div>
  )
}
