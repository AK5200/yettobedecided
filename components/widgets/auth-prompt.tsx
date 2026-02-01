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
     <div className="space-y-4">
       {socialEnabled && (
        <SocialButtons orgSlug={orgSlug} returnUrl={returnUrl} onClick={onSocialClick} />
       )}
 
       {socialEnabled && guestEnabled && (
         <div className="text-xs text-gray-500 text-center">or</div>
       )}
 
       {guestEnabled && (
         <div className="space-y-2">
           <Input
             placeholder="Email"
             value={email}
             onChange={(event) => setEmail(event.target.value)}
           />
           <Input
             placeholder="Name (optional)"
             value={name}
             onChange={(event) => setName(event.target.value)}
           />
           <Button
             className="w-full"
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
