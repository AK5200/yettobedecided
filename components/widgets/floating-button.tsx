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
      className={`fixed z-50 ${positionClasses[position]} flex items-center gap-2 rounded-full px-5 py-3 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer`}
      style={{ 
        backgroundColor: accentColor,
        boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 0 20px -5px ${accentColor}40`
      }}
    >
      <MessageSquare className="h-4 w-4" />
      <span className="text-sm font-semibold">{text}</span>
    </button>
  )
}
