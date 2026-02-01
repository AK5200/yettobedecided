 'use client'
 
 import { useState } from 'react'
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
 import { Button } from '@/components/ui/button'
 import { Copy } from 'lucide-react'
 
 interface CodeExamplesProps {
   secretKey: string
 }
 
 export function CodeExamples({ secretKey }: CodeExamplesProps) {
   const [active, setActive] = useState<'trust' | 'jwt'>('trust')
   const resolvedSecret = secretKey || 'YOUR_SECRET_KEY'
 
   const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text)
   }
 
   return (
     <Tabs value={active} onValueChange={(value) => setActive(value as 'trust' | 'jwt')}>
       <TabsList>
         <TabsTrigger value="trust">Trust Mode</TabsTrigger>
         <TabsTrigger value="jwt">JWT Mode</TabsTrigger>
       </TabsList>
 
       <TabsContent value="trust" className="mt-4">
         <div className="space-y-3">
           <div className="flex items-center justify-between">
             <span className="text-sm font-medium">Frontend (JavaScript)</span>
             <Button
               variant="outline"
               size="sm"
               onClick={() =>
                 copyToClipboard(
                   `FeedbackHub.identify({\n  id: user.id,\n  email: user.email,\n  name: user.name,\n  avatar: user.avatarUrl\n});`
                 )
               }
             >
               <Copy className="h-3 w-3 mr-1" />
               Copy
             </Button>
           </div>
           <pre className="p-4 bg-gray-100 rounded text-sm overflow-x-auto">
             {`FeedbackHub.identify({
   id: user.id,
   email: user.email,
   name: user.name,
   avatar: user.avatarUrl
 });`}
           </pre>
         </div>
       </TabsContent>
 
       <TabsContent value="jwt" className="mt-4 space-y-6">
         <Tabs defaultValue="node">
           <TabsList>
             <TabsTrigger value="node">Node.js</TabsTrigger>
             <TabsTrigger value="python">Python</TabsTrigger>
             <TabsTrigger value="php">PHP</TabsTrigger>
           </TabsList>
 
           <TabsContent value="node" className="mt-4 space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-sm font-medium">Backend (Node.js)</span>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() =>
                   copyToClipboard(
                     `const jwt = require('jsonwebtoken');\n\nconst token = jwt.sign({\n  id: user.id,\n  email: user.email,\n  name: user.name,\n  avatar: user.avatarUrl\n}, '${resolvedSecret}', { expiresIn: '24h' });`
                   )
                 }
               >
                 <Copy className="h-3 w-3 mr-1" />
                 Copy
               </Button>
             </div>
             <pre className="p-4 bg-gray-100 rounded text-sm overflow-x-auto">{`const jwt = require('jsonwebtoken');
 
 const token = jwt.sign({
   id: user.id,
   email: user.email,
   name: user.name,
   avatar: user.avatarUrl
 }, '${resolvedSecret}', { expiresIn: '24h' });
 
 // Send token to frontend`}</pre>
           </TabsContent>
 
           <TabsContent value="python" className="mt-4 space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-sm font-medium">Backend (Python)</span>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() =>
                   copyToClipboard(
                     `import jwt\nfrom datetime import datetime, timedelta\n\nSECRET = '${resolvedSecret}'\n\ntoken = jwt.encode({\n  'id': user.id,\n  'email': user.email,\n  'name': user.name,\n  'avatar': user.avatar_url,\n  'exp': datetime.utcnow() + timedelta(hours=24)\n}, SECRET, algorithm='HS256')`
                   )
                 }
               >
                 <Copy className="h-3 w-3 mr-1" />
                 Copy
               </Button>
             </div>
             <pre className="p-4 bg-gray-100 rounded text-sm overflow-x-auto">{`import jwt
 from datetime import datetime, timedelta
 
 SECRET = '${resolvedSecret}'
 
 token = jwt.encode({
   'id': user.id,
   'email': user.email,
   'name': user.name,
   'avatar': user.avatar_url,
   'exp': datetime.utcnow() + timedelta(hours=24)
 }, SECRET, algorithm='HS256')`}</pre>
           </TabsContent>
 
           <TabsContent value="php" className="mt-4 space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-sm font-medium">Backend (PHP)</span>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() =>
                   copyToClipboard(
                     `use Firebase\\\\JWT\\\\JWT;\n\n$payload = [\n  'id' => $user['id'],\n  'email' => $user['email'],\n  'name' => $user['name'],\n  'avatar' => $user['avatar_url'],\n  'exp' => time() + 60 * 60 * 24\n];\n\n$token = JWT::encode($payload, '${resolvedSecret}', 'HS256');`
                   )
                 }
               >
                 <Copy className="h-3 w-3 mr-1" />
                 Copy
               </Button>
             </div>
             <pre className="p-4 bg-gray-100 rounded text-sm overflow-x-auto">{`use Firebase\\JWT\\JWT;
 
 $payload = [
   'id' => $user['id'],
   'email' => $user['email'],
   'name' => $user['name'],
   'avatar' => $user['avatar_url'],
   'exp' => time() + 60 * 60 * 24
 ];
 
 $token = JWT::encode($payload, '${resolvedSecret}', 'HS256');`}</pre>
           </TabsContent>
         </Tabs>
 
         <div className="space-y-3">
           <div className="flex items-center justify-between">
             <span className="text-sm font-medium">Frontend</span>
             <Button
               variant="outline"
               size="sm"
               onClick={() =>
                 copyToClipboard(
                   `FeedbackHub.identify({ token: tokenFromBackend });`
                 )
               }
             >
               <Copy className="h-3 w-3 mr-1" />
               Copy
             </Button>
           </div>
           <pre className="p-4 bg-gray-100 rounded text-sm overflow-x-auto">{`FeedbackHub.identify({
   token: tokenFromBackend
 });`}</pre>
         </div>
       </TabsContent>
     </Tabs>
   )
 }
