'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  value: string
  onSearch: (value: string) => void
  placeholder?: string
  delayMs?: number
}

export function SearchInput({ value, onSearch, placeholder = 'Search...', delayMs = 300 }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(localValue)
    }, delayMs)
    return () => clearTimeout(timer)
  }, [localValue, delayMs, onSearch])

  return (
    <Input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
    />
  )
}
