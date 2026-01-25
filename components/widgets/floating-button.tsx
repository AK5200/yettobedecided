'use client'

import { MessageSquare } from 'lucide-react'

interface FloatingButtonProps {
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  text: string
  accentColor: string
  onClick: () => void
}

const positionClasses: Record<FloatingButtonProps['position'], string> = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
}

export function FloatingButton({
  position,
  text,
  accentColor,
  onClick,
}: FloatingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed z-50 ${positionClasses[position]} flex items-center gap-2 rounded-full px-4 py-2 text-white shadow-lg transition-transform hover:scale-105`}
      style={{ backgroundColor: accentColor }}
    >
      <MessageSquare className="h-4 w-4" />
      <span className="text-sm font-medium">{text}</span>
    </button>
  )
}
