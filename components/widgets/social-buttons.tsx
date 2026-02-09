 'use client'
 
 import { Button } from '@/components/ui/button'
 import { Github } from 'lucide-react'
 
 interface SocialButtonsProps {
   orgSlug: string
   returnUrl: string
   onClick?: (provider: 'google' | 'github') => void
 }
 
 export function SocialButtons({ orgSlug, returnUrl, onClick }: SocialButtonsProps) {
   const handleRedirect = (provider: 'google' | 'github') => {
     if (onClick) {
       onClick(provider)
       return
     }
     window.location.href = `/api/auth/widget/${provider}?org_slug=${encodeURIComponent(orgSlug)}&return_url=${encodeURIComponent(returnUrl)}`
   }
 
  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full justify-start gap-3 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-medium shadow-sm hover:shadow-md transition-all cursor-pointer"
        onClick={() => handleRedirect('google')}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-sm">
          G
        </span>
        Continue with Google
      </Button>
      <Button
        className="w-full justify-start gap-3 bg-gray-900 text-white hover:bg-gray-800 font-medium shadow-md hover:shadow-lg transition-all cursor-pointer"
        onClick={() => handleRedirect('github')}
      >
        <Github className="h-4 w-4" />
        Continue with GitHub
      </Button>
    </div>
  )
 }
