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
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${
        isPositive
          ? 'bg-emerald-50 text-emerald-700'
          : isNeutral
            ? 'bg-gray-50 text-gray-600'
            : 'bg-red-50 text-red-700'
      }`}
    >
      {isPositive ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : isNeutral ? (
        <Minus className="h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      )}
      <span>
        {formatted}% {label}
      </span>
    </div>
  )
}
