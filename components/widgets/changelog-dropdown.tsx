'use client'

import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'

interface ChangelogEntry {
  id: string
  title: string
  description: string
  published_at: string
  label?: string
}

interface ChangelogDropdownProps {
  orgSlug: string
  accentColor?: string
}

export function ChangelogDropdown({ orgSlug, accentColor = '#000' }: ChangelogDropdownProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [hasNew, setHasNew] = useState(false)

  useEffect(() => {
    const lastSeen = localStorage.getItem(`feedbackhub-dropdown-${orgSlug}`)

    fetch(`/api/changelog?org=${orgSlug}&limit=5`)
      .then(res => res.json())
      .then(data => {
        if (data.entries) {
          setEntries(data.entries)
          if (data.entries.length > 0 && lastSeen !== data.entries[0].id) {
            setHasNew(true)
          }
        }
      })
  }, [orgSlug])

  const markSeen = () => {
    if (entries.length > 0) {
      localStorage.setItem(`feedbackhub-dropdown-${orgSlug}`, entries[0].id)
      setHasNew(false)
    }
  }

  return (
    <Popover onOpenChange={(open) => open && markSeen()}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='relative'>
          <Bell className='h-5 w-5' />
          {hasNew && (
            <span className='absolute -top-1 -right-1 h-3 w-3 rounded-full' style={{ background: accentColor }} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80' align='end'>
        <div className='font-medium mb-2'>Latest Updates</div>
        <div className='space-y-3 max-h-60 overflow-y-auto'>
          {entries.map(entry => (
            <div key={entry.id} className='border-b pb-2 last:border-0'>
              <div className='flex items-center gap-2'>
                {entry.label && (
                  <span className='text-xs px-2 py-0.5 rounded' style={{ background: accentColor, color: '#fff' }}>
                    {entry.label}
                  </span>
                )}
              </div>
              <h4 className='font-medium text-sm mt-1'>{entry.title}</h4>
              <p className='text-xs text-gray-500 line-clamp-2'>{entry.description}</p>
            </div>
          ))}
        </div>
        <div className='pt-2 text-center'>
          <span className='text-xs text-gray-400'>Powered by FeedbackHub</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
