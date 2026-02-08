'use client'

import { useRouter, useSearchParams } from 'next/navigation'

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
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleChange(option.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            days === option.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
