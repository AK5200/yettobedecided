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
        className="w-full justify-start gap-3 border-2 border-border hover:border-border hover:bg-linear-to-r hover:from-muted/50 hover:to-background font-bold text-base py-6 shadow-md hover:shadow-lg transition-all cursor-pointer"
        onClick={() => handleRedirect('google')}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-border text-sm font-extrabold text-foreground/90 shadow-sm">
          G
        </span>
        Continue with Google
      </Button>
    </div>
  )
 }
