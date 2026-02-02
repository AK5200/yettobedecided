'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, BookOpen, Code, Users, Zap, Shield, MessageSquare, Megaphone } from 'lucide-react'
import { toast } from 'sonner'

export default function WidgetDocsPage() {
  const [orgSlug, setOrgSlug] = useState<string>('')
  const [baseUrl, setBaseUrl] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'html' | 'react' | 'nextjs'>('html')
  const [activeCodeTab, setActiveCodeTab] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const fetchOrg = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id, organizations(id, name, slug)')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (membership) {
        const org = membership.organizations as any
        setOrgSlug(org?.slug || '')
      }
    }
    fetchOrg()
    setBaseUrl(typeof window !== 'undefined' ? window.location.origin : '')
  }, [])

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const setCodeTab = (blockId: string, tab: string) => {
    setActiveCodeTab(prev => ({ ...prev, [blockId]: tab }))
  }

  const getCodeTab = (blockId: string) => activeCodeTab[blockId] || 'html'

  const initCode = {
    html: `<!-- FeedbackHub Widget -->
<script>
  !function(f,e,d,b,a,c,k){if(!f.FeedbackHub){
    c=e.createElement(d);c.async=1;c.src=b;
    k=e.getElementsByTagName(d)[0];k.parentNode.insertBefore(c,k);
    f.FeedbackHub=function(){(f.FeedbackHub.q=f.FeedbackHub.q||[]).push(arguments)};
  }}(window,document,"script","${baseUrl}/widget.js");

  // Initialize the widget
  FeedbackHub('init', {
    workspace: '${orgSlug}',
    boardId: 'your-board-id',
  });
</script>`,
    react: `import { useEffect } from 'react';

export function FeedbackHubWidget() {
  useEffect(() => {
    // Load SDK
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    script.onload = () => {
      window.FeedbackHub('init', {
        workspace: '${orgSlug}',
        boardId: 'your-board-id',
      });
    };
    document.head.appendChild(script);
    
    return () => script.remove();
  }, []);
  
  return null;
}`,
    nextjs: `'use client';

import Script from 'next/script';

export function FeedbackHubWidget() {
  return (
    <Script
      src="${baseUrl}/widget.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.FeedbackHub('init', {
          workspace: '${orgSlug}',
          boardId: 'your-board-id',
        });
      }}
    />
  );
}`
  }

  const identifyCode = `// Identify the logged-in user
FeedbackHub('identify', {
  id: 'user_123',          // Required: unique user ID
  email: 'john@example.com', // Required: user email
  name: 'John Smith',        // Optional: display name
  avatar: 'https://...',    // Optional: avatar URL
});`

  const jwtNodeCode = `const jwt = require('jsonwebtoken');

// Your SSO secret from FeedbackHub settings
const SSO_SECRET = process.env.FEEDBACKHUB_SSO_SECRET;

function createFeedbackHubToken(user) {
  const payload = {
    sub: user.id,             // Required: unique user ID
    email: user.email,         // Required: user email
    name: user.name,           // Optional: display name
    avatar: user.avatarUrl,    // Optional: avatar URL
    plan: user.plan,           // Optional: custom attribute
    company: {                 // Optional: company data
      id: user.company?.id,
      name: user.company?.name,
      plan: user.company?.plan,
    },
  };

  return jwt.sign(payload, SSO_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h',
  });
}

// Express.js example endpoint
app.get('/api/feedbackhub-token', (req, res) => {
  const user = req.user; // From your auth middleware
  const token = createFeedbackHubToken(user);
  res.json({ token });
});`

  const jwtFrontendCode = `// Initialize widget
FeedbackHub('init', {
  workspace: '${orgSlug}',
  boardId: 'your-board-id',
});

// Fetch token from your server
async function initFeedbackHub() {
  const response = await fetch('/api/feedbackhub-token');
  const { token } = await response.json();
  
  // Identify with JWT token
  FeedbackHub('identify', {
    ssoToken: token
  });
}

initFeedbackHub();`

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-muted/50 border-r border-border fixed h-screen overflow-y-auto p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary rounded-lg">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">FeedbackHub</span>
          </div>
          
          <nav className="space-y-6">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Getting Started
              </div>
              <a href="#introduction" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Introduction
              </a>
              <a href="#quickstart" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Quick Start
              </a>
            </div>
            
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Identify Users
              </div>
              <a href="#guest-mode" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Guest Mode
              </a>
              <a href="#trust-mode" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Trust Mode
              </a>
              <a href="#jwt-mode" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                JWT Mode (SSO)
              </a>
            </div>
            
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Widgets
              </div>
              <a href="#feedback-widget" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Feedback Widget
              </a>
              <a href="#changelog-widget" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Changelog Widget
              </a>
            </div>
            
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Reference
              </div>
              <a href="#sdk-methods" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                SDK Methods
              </a>
              <a href="#user-properties" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                User Properties
              </a>
              <a href="#events" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Events
              </a>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-12 max-w-4xl">
          {/* Introduction */}
          <section id="introduction" className="mb-16 scroll-mt-8">
            <h1 className="text-4xl font-bold mb-4">Widget Integration Guide</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Embed FeedbackHub into your website to collect user feedback, display your roadmap, and share product updates — all without leaving your app.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              <Card>
                <CardContent className="p-6">
                  <MessageSquare className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Feedback Widget</h3>
                  <p className="text-sm text-muted-foreground">Collect feature requests and bug reports from your users.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Megaphone className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Changelog Widget</h3>
                  <p className="text-sm text-muted-foreground">Announce new features and updates to your users.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Shield className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">User Identification</h3>
                  <p className="text-sm text-muted-foreground">Link feedback to your existing user accounts.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Zap className="h-7 w-7 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Easy Integration</h3>
                  <p className="text-sm text-muted-foreground">Add to any website with a simple code snippet.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <hr className="my-12" />

          {/* Quick Start */}
          <section id="quickstart" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">Quick Start</h2>
            <p className="text-muted-foreground mb-8">Get up and running with FeedbackHub in under 5 minutes.</p>

            <div className="space-y-8">
              <div className="relative pl-12 border-l-2">
                <div className="absolute -left-[13px] top-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  1
                </div>
                <h3 className="font-semibold text-lg mb-2">Get your credentials</h3>
                <p className="text-muted-foreground mb-3">
                  Log in to your FeedbackHub dashboard and navigate to <strong>Settings → Widgets</strong> to find your:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>Workspace slug</strong> — Your unique workspace identifier</li>
                  <li><strong>Board ID</strong> — The board where feedback will be collected</li>
                  <li><strong>SSO Secret</strong> — For secure user identification (optional)</li>
                </ul>
              </div>

              <div className="relative pl-12 border-l-2">
                <div className="absolute -left-[13px] top-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  2
                </div>
                <h3 className="font-semibold text-lg mb-2">Add the widget to your site</h3>
                <p className="text-muted-foreground mb-3">
                  Copy and paste this code snippet before the closing <code className="bg-muted px-1.5 py-0.5 rounded text-sm">&lt;/body&gt;</code> tag:
                </p>
                
                <Card className="bg-[#1e1e1e] border-gray-800">
                  <div className="flex items-center justify-between p-3 border-b border-gray-700">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 text-xs ${activeTab === 'html' ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('html')}
                      >
                        HTML
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 text-xs ${activeTab === 'react' ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('react')}
                      >
                        React
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 text-xs ${activeTab === 'nextjs' ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('nextjs')}
                      >
                        Next.js
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-gray-400 hover:text-white"
                      onClick={() => copyCode(initCode[activeTab], 'init')}
                    >
                      {copiedCode === 'init' ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{initCode[activeTab]}</code>
                    </pre>
                  </div>
                </Card>
              </div>

              <div className="relative pl-12 border-l-2">
                <div className="absolute -left-[13px] top-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  3
                </div>
                <h3 className="font-semibold text-lg mb-2">Identify your users (optional)</h3>
                <p className="text-muted-foreground mb-3">
                  To link feedback to your user accounts, add the <code className="bg-muted px-1.5 py-0.5 rounded text-sm">identify</code> call after initialization:
                </p>
                
                <Card className="bg-[#1e1e1e] border-gray-800">
                  <div className="flex items-center justify-end p-3 border-b border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-gray-400 hover:text-white"
                      onClick={() => copyCode(identifyCode, 'identify')}
                    >
                      {copiedCode === 'identify' ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{identifyCode}</code>
                    </pre>
                  </div>
                </Card>
              </div>

              <div className="relative pl-12">
                <div className="absolute -left-[13px] top-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  4
                </div>
                <h3 className="font-semibold text-lg mb-2">That&apos;s it! 🎉</h3>
                <p className="text-muted-foreground">
                  Your users can now submit feedback directly from your website. All submissions will appear in your FeedbackHub dashboard.
                </p>
              </div>
            </div>
          </section>

          <hr className="my-12" />

          {/* Guest Mode */}
          <section id="guest-mode" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">Guest Mode</h2>
            <p className="text-muted-foreground mb-6">
              Allow anyone to submit feedback without requiring authentication. This is the simplest setup and works great for public-facing feedback boards.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
              <div className="text-blue-600 text-xl">ℹ️</div>
              <div>
                <div className="font-semibold text-blue-900 mb-1">When to use Guest Mode</div>
                <p className="text-sm text-blue-700">
                  Guest mode is ideal for public feedback boards, landing pages, or when you want to reduce friction for users submitting feedback.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-3">Implementation</h3>
            <p className="text-muted-foreground mb-4">
              Simply initialize the widget without calling <code className="bg-muted px-1.5 py-0.5 rounded text-sm">identify</code>:
            </p>

            <Card className="bg-[#1e1e1e] border-gray-800">
              <div className="flex items-center justify-end p-3 border-b border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-400 hover:text-white"
                  onClick={() => copyCode(initCode.html, 'guest')}
                >
                  {copiedCode === 'guest' ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono">
                  <code>{initCode.html}</code>
                </pre>
              </div>
            </Card>

            <h3 className="text-xl font-semibold mt-8 mb-3">What users see</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Posts appear with a &quot;Guest&quot; label</li>
              <li>No user avatar or name displayed</li>
              <li>Users can optionally enter their email when posting</li>
            </ul>
          </section>

          <hr className="my-12" />

          {/* Trust Mode */}
          <section id="trust-mode" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">Trust Mode</h2>
            <p className="text-muted-foreground mb-6">
              Pass user information directly from your frontend. Quick to implement, but not cryptographically verified.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
              <div className="text-amber-600 text-xl">⚠️</div>
              <div>
                <div className="font-semibold text-amber-900 mb-1">Security Note</div>
                <p className="text-sm text-amber-700">
                  Trust mode passes user data from the client-side, which can be manipulated. For production apps handling sensitive data, we recommend <a href="#jwt-mode" className="underline">JWT Mode</a> instead.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-3">Implementation</h3>
            <Card className="bg-[#1e1e1e] border-gray-800">
              <div className="flex items-center justify-end p-3 border-b border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-400 hover:text-white"
                  onClick={() => copyCode(identifyCode, 'trust')}
                >
                  {copiedCode === 'trust' ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono">
                  <code>{identifyCode}</code>
                </pre>
              </div>
            </Card>

            <h3 className="text-xl font-semibold mt-8 mb-3">What users see</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Posts display user&apos;s name and avatar</li>
              <li><strong>No</strong> verified badge (✓) appears</li>
              <li>User data stored with <code className="bg-muted px-1.5 py-0.5 rounded text-sm">source: 'identified'</code></li>
            </ul>
          </section>

          <hr className="my-12" />

          {/* JWT Mode */}
          <section id="jwt-mode" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">JWT Mode (SSO)</h2>
            <p className="text-muted-foreground mb-6">
              The most secure method. Your server signs a JWT token that FeedbackHub verifies. Users get a verified badge (✓) and their data is cryptographically authenticated.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex gap-3">
              <div className="text-green-600 text-xl">✅</div>
              <div>
                <div className="font-semibold text-green-900 mb-1">Recommended for Production</div>
                <p className="text-sm text-green-700">
                  JWT mode prevents user impersonation and provides the highest level of trust for feedback attribution.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-3">How it works</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4 mb-6">
              <li>User logs into your application</li>
              <li>Your server generates a JWT token signed with your SSO secret</li>
              <li>Frontend passes the token to FeedbackHub</li>
              <li>FeedbackHub verifies the signature and authenticates the user</li>
            </ol>

            <h3 className="text-xl font-semibold mt-8 mb-3">Step 1: Server-side token generation</h3>
            <p className="text-muted-foreground mb-4">Generate a JWT token on your server when the user logs in:</p>

            <Card className="bg-[#1e1e1e] border-gray-800">
              <div className="flex items-center justify-between p-3 border-b border-gray-700">
                <span className="text-xs text-gray-400">Node.js</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-400 hover:text-white"
                  onClick={() => copyCode(jwtNodeCode, 'jwt-node')}
                >
                  {copiedCode === 'jwt-node' ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono">
                  <code>{jwtNodeCode}</code>
                </pre>
              </div>
            </Card>

            <h3 className="text-xl font-semibold mt-8 mb-3">Step 2: Frontend implementation</h3>
            <p className="text-muted-foreground mb-4">Fetch the token from your server and pass it to FeedbackHub:</p>

            <Card className="bg-[#1e1e1e] border-gray-800">
              <div className="flex items-center justify-end p-3 border-b border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-400 hover:text-white"
                  onClick={() => copyCode(jwtFrontendCode, 'jwt-frontend')}
                >
                  {copiedCode === 'jwt-frontend' ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono">
                  <code>{jwtFrontendCode}</code>
                </pre>
              </div>
            </Card>

            <h3 className="text-xl font-semibold mt-8 mb-3">What users see</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Posts display user&apos;s name and avatar</li>
              <li><strong>Verified badge (✓)</strong> appears next to their name</li>
              <li>User data stored with <code className="bg-muted px-1.5 py-0.5 rounded text-sm">source: 'verified_jwt'</code></li>
              <li>Custom attributes available for filtering and prioritization</li>
            </ul>
          </section>

          <hr className="my-12" />

          {/* SDK Methods */}
          <section id="sdk-methods" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">SDK Methods</h2>
            <p className="text-muted-foreground mb-8">Complete reference of all available SDK methods.</p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub('init', options)</code>
                </h3>
                <p className="text-muted-foreground mb-4">
                  Initialize the FeedbackHub widget. Must be called before any other methods.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Parameter</th>
                        <th className="text-left p-3 font-semibold">Type</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">
                          <code className="bg-muted px-1.5 py-0.5 rounded">workspace</code>{' '}
                          <Badge variant="destructive" className="ml-2">Required</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">string</td>
                        <td className="p-3 text-muted-foreground">Your workspace slug</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">
                          <code className="bg-muted px-1.5 py-0.5 rounded">boardId</code>
                        </td>
                        <td className="p-3 text-muted-foreground">string</td>
                        <td className="p-3 text-muted-foreground">Board ID for feedback widgets</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">
                          <code className="bg-muted px-1.5 py-0.5 rounded">type</code>
                        </td>
                        <td className="p-3 text-muted-foreground">string</td>
                        <td className="p-3 text-muted-foreground">
                          <code className="bg-muted px-1.5 py-0.5 rounded">'popup'</code> | <code className="bg-muted px-1.5 py-0.5 rounded">'popover'</code> | <code className="bg-muted px-1.5 py-0.5 rounded">'embed'</code> | <code className="bg-muted px-1.5 py-0.5 rounded">'changelog-popup'</code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub('identify', user)</code>
                </h3>
                <p className="text-muted-foreground mb-4">
                  Identify the current user. Can use direct user data (Trust mode) or a JWT token (SSO mode).
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub('clearIdentity')</code>
                </h3>
                <p className="text-muted-foreground">Clear the current user identity. Call this when the user logs out.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub('open')</code>
                </h3>
                <p className="text-muted-foreground">Programmatically open the widget.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub('close')</code>
                </h3>
                <p className="text-muted-foreground">Programmatically close the widget.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub('on', event, callback)</code>
                </h3>
                <p className="text-muted-foreground">
                  Listen for widget events. See <a href="#events" className="text-primary underline">Events</a> for available events.
                </p>
              </div>
            </div>
          </section>

          <hr className="my-12" />

          {/* User Properties */}
          <section id="user-properties" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">User Properties</h2>
            <p className="text-muted-foreground mb-6">Properties you can pass when identifying users.</p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Property</th>
                    <th className="text-left p-3 font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">id</code>
                    </td>
                    <td className="p-3 text-muted-foreground">string</td>
                    <td className="p-3 text-muted-foreground">Unique identifier for the user in your system</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">email</code>
                    </td>
                    <td className="p-3 text-muted-foreground">string</td>
                    <td className="p-3 text-muted-foreground">User&apos;s email address</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">name</code>
                    </td>
                    <td className="p-3 text-muted-foreground">string</td>
                    <td className="p-3 text-muted-foreground">User&apos;s display name</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">avatar</code>
                    </td>
                    <td className="p-3 text-muted-foreground">string</td>
                    <td className="p-3 text-muted-foreground">URL to user&apos;s profile picture</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">plan</code>
                    </td>
                    <td className="p-3 text-muted-foreground">string</td>
                    <td className="p-3 text-muted-foreground">User&apos;s subscription plan (e.g., &apos;free&apos;, &apos;pro&apos;, &apos;enterprise&apos;)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <hr className="my-12" />

          {/* Events */}
          <section id="events" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">Events</h2>
            <p className="text-muted-foreground mb-6">Subscribe to widget events to integrate with your application.</p>

            <Card className="bg-[#1e1e1e] border-gray-800 mb-6">
              <div className="flex items-center justify-end p-3 border-b border-gray-700">
                <span className="text-xs text-gray-400">JavaScript</span>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono">
                  <code>{`// Widget ready
FeedbackHub('on', 'ready', () => {
  console.log('Widget loaded and ready');
});

// Widget opened
FeedbackHub('on', 'open', () => {
  console.log('Widget opened');
});

// Widget closed
FeedbackHub('on', 'close', () => {
  console.log('Widget closed');
});

// Feedback submitted
FeedbackHub('on', 'feedback:submitted', (post) => {
  console.log('New feedback:', post.title);
  // Track in your analytics
  analytics.track('Feedback Submitted', { postId: post.id });
});

// User identified
FeedbackHub('on', 'user:identified', (user) => {
  console.log('User identified:', user.email);
});`}</code>
                </pre>
              </div>
            </Card>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Event</th>
                    <th className="text-left p-3 font-semibold">Payload</th>
                    <th className="text-left p-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">ready</code>
                    </td>
                    <td className="p-3 text-muted-foreground">—</td>
                    <td className="p-3 text-muted-foreground">Widget has loaded and is ready</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">open</code>
                    </td>
                    <td className="p-3 text-muted-foreground">—</td>
                    <td className="p-3 text-muted-foreground">Widget was opened</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">close</code>
                    </td>
                    <td className="p-3 text-muted-foreground">—</td>
                    <td className="p-3 text-muted-foreground">Widget was closed</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">feedback:submitted</code>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded">{'{ id, title, ... }'}</code>
                    </td>
                    <td className="p-3 text-muted-foreground">User submitted feedback</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">user:identified</code>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded">{'{ id, email, name }'}</code>
                    </td>
                    <td className="p-3 text-muted-foreground">User was successfully identified</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
