'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface AnnouncementBarProps {
  orgSlug: string
  accentColor?: string
  link?: string
}

export function AnnouncementBar({ orgSlug, accentColor = '#000', link }: AnnouncementBarProps) {
  const [entry, setEntry] = useState<{ title: string; label?: string } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const dismissedId = localStorage.getItem(`feedbackhub-bar-${orgSlug}`)

    fetch(`/api/changelog?org=${orgSlug}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.entries && data.entries.length > 0) {
          const latest = data.entries[0]
          if (dismissedId !== latest.id) {
            setEntry({ title: latest.title, label: latest.label })
          }
        }
      })
  }, [orgSlug])

  const dismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fetch(`/api/changelog?org=${orgSlug}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.entries?.[0]) {
          localStorage.setItem(`feedbackhub-bar-${orgSlug}`, data.entries[0].id)
        }
      })
    setDismissed(true)
  }

  if (!entry || dismissed) return null

  return (
    <div
      className='w-full py-2 px-4 text-center text-sm flex items-center justify-center gap-2 cursor-pointer'
      style={{ background: accentColor, color: '#fff' }}
      onClick={() => link && window.open(link, '_blank')}
    >
      {entry.label && (
        <span className='bg-white/20 px-2 py-0.5 rounded text-xs font-medium'>
          {entry.label}
        </span>
      )}
      <span>{entry.title}</span>
      <span className='ml-1'>→</span>
      <button onClick={dismiss} className='ml-4 hover:bg-white/20 rounded p-1'>
        <X className='h-4 w-4' />
      </button>
    </div>
  )
}
