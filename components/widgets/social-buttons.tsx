 'use client'

 import { Button } from '@/components/ui/button'

 interface SocialButtonsProps {
   orgSlug: string
   returnUrl: string
   onClick?: (provider: 'google') => void
 }

 export function SocialButtons({ orgSlug, returnUrl, onClick }: SocialButtonsProps) {
   const handleRedirect = (provider: 'google') => {
     if (onClick) {
       onClick(provider)
       return
     }
     window.location.href = `/api/auth/widget/${provider}?org_slug=${encodeURIComponent(orgSlug)}&return_url=${encodeURIComponent(returnUrl)}`
   }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full justify-start gap-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white font-bold text-base py-6 shadow-md hover:shadow-lg transition-all cursor-pointer"
        onClick={() => handleRedirect('google')}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-gray-300 text-sm font-extrabold text-gray-800 shadow-sm">
          G
        </span>
        Continue with Google
      </Button>
    </div>
  )
 }
