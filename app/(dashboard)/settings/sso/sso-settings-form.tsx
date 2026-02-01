 'use client';
 
 import { useState, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
 
 export function SSOSettingsForm() {
   const [ssoMode, setSsoMode] = useState('guest_only');
   const [secretKey, setSecretKey] = useState('');
   const [showKey, setShowKey] = useState(false);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   
   useEffect(() => {
     fetchSettings();
   }, []);
   
   const fetchSettings = async () => {
     try {
       const res = await fetch('/api/sso/settings');
       const data = await res.json();
       if (data.sso_mode) setSsoMode(data.sso_mode);
       if (data.secret_key) setSecretKey(data.secret_key);
     } catch (error) {
       console.error('Failed to fetch SSO settings:', error);
     } finally {
       setLoading(false);
     }
   };
   
   const saveSettings = async () => {
     setSaving(true);
     try {
       const res = await fetch('/api/sso/settings', {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ sso_mode: ssoMode }),
       });
       if (!res.ok) throw new Error('Failed to save');
     } catch (error) {
       console.error('Failed to save SSO settings:', error);
     } finally {
       setSaving(false);
     }
   };
   
   const generateKey = async () => {
     if (!confirm('This will invalidate all existing tokens. Continue?')) return;
     try {
       const res = await fetch('/api/sso/settings', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ action: 'generate_key' }),
       });
       const data = await res.json();
       if (data.secret_key) setSecretKey(data.secret_key);
     } catch (error) {
       console.error('Failed to generate key:', error);
     }
   };
   
   const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
   };
   
   if (loading) {
     return <div className='text-gray-500'>Loading settings...</div>;
   }
   
   return (
     <div className='space-y-8 max-w-2xl'>
       <Card>
         <CardHeader>
           <CardTitle>Authentication Mode</CardTitle>
           <CardDescription>
             Choose how users are identified when submitting feedback
           </CardDescription>
         </CardHeader>
         <CardContent>
           <RadioGroup value={ssoMode} onValueChange={setSsoMode} className='space-y-4'>
             <div className='flex items-start space-x-3 p-4 border rounded-lg'>
               <RadioGroupItem value='guest_only' id='guest_only' className='mt-1' />
               <div>
                 <Label htmlFor='guest_only' className='font-medium'>Guest Only</Label>
                 <p className='text-sm text-gray-500'>
                   Users must enter their email for each interaction. No identification from your website.
                 </p>
               </div>
             </div>
             <div className='flex items-start space-x-3 p-4 border rounded-lg'>
               <RadioGroupItem value='trust' id='trust' className='mt-1' />
               <div>
                 <Label htmlFor='trust' className='font-medium'>Trust Mode</Label>
                 <p className='text-sm text-gray-500'>
                   Accept user data from your website without verification. Easy to set up, less secure.
                 </p>
               </div>
             </div>
             <div className='flex items-start space-x-3 p-4 border rounded-lg'>
               <RadioGroupItem value='jwt_required' id='jwt_required' className='mt-1' />
               <div>
                 <Label htmlFor='jwt_required' className='font-medium'>JWT Required (Secure)</Label>
                 <p className='text-sm text-gray-500'>
                   Verify user identity with signed JWT token. Requires backend implementation.
                 </p>
               </div>
             </div>
           </RadioGroup>
           <Button onClick={saveSettings} disabled={saving} className='mt-6'>
             {saving ? 'Saving...' : 'Save Settings'}
           </Button>
         </CardContent>
       </Card>
       {(ssoMode === 'jwt_required' || ssoMode === 'trust') && (
         <Card>
           <CardHeader>
             <CardTitle>Secret Key</CardTitle>
             <CardDescription>
               Use this key to sign JWT tokens on your server. Keep it secret!
             </CardDescription>
           </CardHeader>
           <CardContent>
             {secretKey ? (
               <div className='space-y-4'>
                 <div className='flex items-center gap-2'>
                   <code className='flex-1 p-3 bg-gray-100 rounded font-mono text-sm overflow-hidden'>
                     {showKey ? secretKey : '•'.repeat(40)}
                   </code>
                   <Button variant='outline' size='icon' onClick={() => setShowKey(!showKey)}>
                     {showKey ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                   </Button>
                   <Button variant='outline' size='icon' onClick={() => copyToClipboard(secretKey)}>
                     <Copy className='h-4 w-4' />
                   </Button>
                 </div>
                 <Button variant='outline' onClick={generateKey}>
                   <RefreshCw className='h-4 w-4 mr-2' />
                   Regenerate Key
                 </Button>
               </div>
             ) : (
               <Button onClick={generateKey}>
                 Generate Secret Key
               </Button>
             )}
           </CardContent>
         </Card>
       )}
       <Card>
         <CardHeader>
           <CardTitle>Integration Guide</CardTitle>
           <CardDescription>
             Add this code to your website to identify users
           </CardDescription>
         </CardHeader>
         <CardContent className='space-y-6'>
           {ssoMode === 'trust' && (
             <div>
               <Label className='mb-2 block'>Trust Mode (Frontend)</Label>
               <div className='relative'>
                 <pre className='p-4 bg-gray-100 rounded text-sm overflow-x-auto'>
                   {`FeedbackHub.identify({
   id: 'user-123',
   email: 'user@example.com',
   name: 'John Doe',
   avatar: 'https://...'
 });`}
                 </pre>
                 <Button
                   variant='outline'
                   size='sm'
                   className='absolute top-2 right-2'
                   onClick={() => copyToClipboard(`FeedbackHub.identify({\n  id: 'user-123',\n  email: 'user@example.com',\n  name: 'John Doe',\n  avatar: 'https://...'\n});`)}
                 >
                   <Copy className='h-3 w-3' />
                 </Button>
               </div>
             </div>
           )}
           
           {ssoMode === 'jwt_required' && (
             <>
               <div>
                 <Label className='mb-2 block'>Backend (Node.js)</Label>
                 <div className='relative'>
                   <pre className='p-4 bg-gray-100 rounded text-sm overflow-x-auto'>
                     {`const jwt = require('jsonwebtoken');
 
 const token = jwt.sign({
   id: user.id,
   email: user.email,
   name: user.name,
 }, '${secretKey || 'YOUR_SECRET_KEY'}');`}
                   </pre>
                 </div>
               </div>
               <div>
                 <Label className='mb-2 block'>Frontend</Label>
                 <div className='relative'>
                   <pre className='p-4 bg-gray-100 rounded text-sm overflow-x-auto'>
                     {`FeedbackHub.identify({
   token: 'eyJhbGciOiJIUzI1NiIs...'
 });`}
                   </pre>
                 </div>
               </div>
             </>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }
