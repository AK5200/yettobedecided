 'use client'
 
 import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SocialButtons } from './social-buttons'
 
interface AuthPromptProps {
  orgSlug: string
  onGuestSubmit: (email: string, name: string) => void
  onSocialClick?: (provider: 'google' | 'github') => void
}
 
 interface WidgetConfig {
   auth: {
     guestPostingEnabled: boolean
     socialLoginEnabled: boolean
     ssoRedirectEnabled: boolean
     ssoRedirectUrl: string | null
   }
 }
 
 export function AuthPrompt({ orgSlug, onGuestSubmit, onSocialClick }: AuthPromptProps) {
   const [loading, setLoading] = useState(true)
   const [email, setEmail] = useState('')
   const [name, setName] = useState('')
   const [config, setConfig] = useState<WidgetConfig | null>(null)
 
   useEffect(() => {
     const fetchConfig = async () => {
       try {
         const res = await fetch(`/api/widget/config?org=${encodeURIComponent(orgSlug)}`)
         const data = await res.json()
         setConfig(data)
       } catch (error) {
         console.error('Failed to load widget config:', error)
       } finally {
         setLoading(false)
       }
     }
     fetchConfig()
   }, [orgSlug])
 
   if (loading) {
     return <div className="text-sm text-gray-500">Loading...</div>
   }
 
   const guestEnabled = config?.auth?.guestPostingEnabled ?? true
   const socialEnabled = config?.auth?.socialLoginEnabled ?? false
 
  const returnUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
     <div className="space-y-5">
       {socialEnabled && (
        <SocialButtons orgSlug={orgSlug} returnUrl={returnUrl} onClick={onSocialClick} />
       )}

       {socialEnabled && guestEnabled && (
         <div className="text-xs text-gray-500 text-center font-medium relative">
           <span className="bg-white px-2 relative z-10">or</span>
           <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-gray-200"></div>
           </div>
         </div>
       )}

       {guestEnabled && (
         <div className="space-y-3">
           <Input
             placeholder="Email"
             value={email}
             onChange={(event) => setEmail(event.target.value)}
             className="border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
           />
           <Input
             placeholder="Name (optional)"
             value={name}
             onChange={(event) => setName(event.target.value)}
             className="border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
           />
           <Button
             className="w-full font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
             onClick={() => onGuestSubmit(email, name)}
             disabled={!email}
           >
             Continue
           </Button>
         </div>
       )}
     </div>
   )
 }
