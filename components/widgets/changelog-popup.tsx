'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ChangelogEntry {
  id: string
  title: string
  description: string
  published_at: string
  label?: string
}

interface ChangelogPopupProps {
  orgSlug: string
  accentColor?: string
}

export function ChangelogPopup({ orgSlug, accentColor = '#000' }: ChangelogPopupProps) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ChangelogEntry[]>([])

  useEffect(() => {
    // Check if user has seen latest changelog
    const lastSeen = localStorage.getItem(`feedbackhub-changelog-${orgSlug}`)

    fetch(`/api/changelog?org=${orgSlug}&limit=5`)
      .then(res => res.json())
      .then(data => {
        if (data.entries && data.entries.length > 0) {
          setEntries(data.entries)
          const latestId = data.entries[0].id
          if (lastSeen !== latestId) {
            setOpen(true)
          }
        }
      })
  }, [orgSlug])

  const handleClose = () => {
    if (entries.length > 0) {
      localStorage.setItem(`feedbackhub-changelog-${orgSlug}`, entries[0].id)
    }
    setOpen(false)
    window.parent.postMessage('feedbackhub:close', '*')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            Welcome back 👋
          </DialogTitle>
          <p className='text-sm text-gray-500'>Here is what we added while you were away.</p>
        </DialogHeader>

        <div className='space-y-4 max-h-80 overflow-y-auto'>
          {entries.map(entry => (
            <div key={entry.id} className='border-b pb-4 last:border-0'>
              {entry.label && (
                <span className='text-xs px-2 py-1 rounded' style={{ background: accentColor, color: '#fff' }}>
                  {entry.label}
                </span>
              )}
              <h3 className='font-medium mt-2'>{entry.title}</h3>
              <p className='text-sm text-gray-600 mt-1'>{entry.description}</p>
            </div>
          ))}
        </div>

        <div className='flex justify-between items-center pt-4'>
          <span className='text-xs text-gray-400'>Powered by FeedbackHub</span>
          <Button variant='outline' size='sm' onClick={handleClose}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
