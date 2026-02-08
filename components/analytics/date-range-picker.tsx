'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  defaultDays?: number
}

export function DateRangePicker({ defaultDays = 30 }: DateRangePickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const days = searchParams.get('days') || String(defaultDays)

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '365') {
      params.delete('days')
    } else {
      params.set('days', value)
    }
    router.push(`/analytics?${params.toString()}`)
  }

  const options = [
    { label: '7D', value: '7' },
    { label: '30D', value: '30' },
    { label: '90D', value: '90' },
    { label: 'All', value: '365' },
  ]

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
      <Calendar className="h-4 w-4 text-gray-500 ml-2" />
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleChange(option.value)}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            days === option.value
              ? 'bg-amber-100 text-amber-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
