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
     <div className="space-y-2">
       <Button
         variant="outline"
         className="w-full justify-start gap-2"
         onClick={() => handleRedirect('google')}
       >
         <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white border text-xs font-semibold text-gray-700">
           G
         </span>
         Continue with Google
       </Button>
       <Button
         className="w-full justify-start gap-2 bg-gray-900 text-white hover:bg-gray-800"
         onClick={() => handleRedirect('github')}
       >
         <Github className="h-4 w-4" />
         Continue with GitHub
       </Button>
     </div>
   )
 }
