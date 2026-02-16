'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy, Check, Terminal, Globe } from 'lucide-react'
import { toast } from 'sonner'

interface CodeExamplesProps {
  secretKey: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-8 px-2.5 text-gray-400 hover:text-gray-600 rounded-lg"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

function CodeBlock({ label, icon, code }: { label: string; icon: React.ReactNode; code: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon}
          {label}
        </div>
        <CopyButton text={code} />
      </div>
      <div className="relative rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-800">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <pre className="p-4 text-sm text-gray-300 overflow-x-auto leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

export function CodeExamples({ secretKey }: CodeExamplesProps) {
  const [active, setActive] = useState<'trust' | 'jwt'>('trust')
  const resolvedSecret = secretKey || 'YOUR_SECRET_KEY'

  return (
    <Tabs value={active} onValueChange={(value) => setActive(value as 'trust' | 'jwt')}>
      <TabsList className="bg-gray-100 p-1 rounded-xl">
        <TabsTrigger value="trust" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
          Trust Mode
        </TabsTrigger>
        <TabsTrigger value="jwt" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
          JWT Mode
        </TabsTrigger>
      </TabsList>

      <TabsContent value="trust" className="mt-5">
        <CodeBlock
          label="Frontend (JavaScript)"
          icon={<Globe className="h-4 w-4 text-amber-500" />}
          code={`FeedbackHub.identify({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatarUrl
});`}
        />
      </TabsContent>

      <TabsContent value="jwt" className="mt-5 space-y-6">
        <Tabs defaultValue="node">
          <TabsList className="bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="node" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-sm">
              Node.js
            </TabsTrigger>
            <TabsTrigger value="python" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-sm">
              Python
            </TabsTrigger>
            <TabsTrigger value="php" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 text-sm">
              PHP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="node" className="mt-4">
            <CodeBlock
              label="Backend (Node.js)"
              icon={<Terminal className="h-4 w-4 text-emerald-500" />}
              code={`const jwt = require('jsonwebtoken');

const token = jwt.sign({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatarUrl
}, '${resolvedSecret}', { expiresIn: '24h' });

// Send token to frontend`}
            />
          </TabsContent>

          <TabsContent value="python" className="mt-4">
            <CodeBlock
              label="Backend (Python)"
              icon={<Terminal className="h-4 w-4 text-blue-500" />}
              code={`import jwt
from datetime import datetime, timedelta

SECRET = '${resolvedSecret}'

token = jwt.encode({
  'id': user.id,
  'email': user.email,
  'name': user.name,
  'avatar': user.avatar_url,
  'exp': datetime.utcnow() + timedelta(hours=24)
}, SECRET, algorithm='HS256')`}
            />
          </TabsContent>

          <TabsContent value="php" className="mt-4">
            <CodeBlock
              label="Backend (PHP)"
              icon={<Terminal className="h-4 w-4 text-violet-500" />}
              code={`use Firebase\\JWT\\JWT;

$payload = [
  'id' => $user['id'],
  'email' => $user['email'],
  'name' => $user['name'],
  'avatar' => $user['avatar_url'],
  'exp' => time() + 60 * 60 * 24
];

$token = JWT::encode($payload, '${resolvedSecret}', 'HS256');`}
            />
          </TabsContent>
        </Tabs>

        <CodeBlock
          label="Frontend"
          icon={<Globe className="h-4 w-4 text-amber-500" />}
          code={`FeedbackHub.identify({
  token: tokenFromBackend
});`}
        />
      </TabsContent>
    </Tabs>
  )
}
