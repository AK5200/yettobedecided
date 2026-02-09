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
      className={`fixed z-50 ${positionClasses[position]} flex items-center gap-3 rounded-full px-6 py-4 text-white shadow-2xl hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-sm`}
      style={{ 
        background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
        boxShadow: `0 12px 30px -8px rgba(0, 0, 0, 0.3), 0 0 30px -10px ${accentColor}80`
      }}
    >
      <MessageSquare className="h-5 w-5" />
      <span className="text-base font-bold">{text}</span>
    </button>
  )
}
