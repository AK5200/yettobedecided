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
<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
></script>

<!-- Optional: Identify user (Trust Mode) -->
<script>
  FeedbackHub.identify({
    id: 'user_123',
    email: 'john@example.com',
    name: 'John Smith',
    avatar: 'https://...'
  });
</script>`,
    react: `import { useEffect } from 'react';

export function FeedbackHubWidget() {
  useEffect(() => {
    // Load SDK
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.setAttribute('data-org', '${orgSlug}');
    script.async = true;
    script.onload = () => {
      // Optional: Identify user after SDK loads
      if (window.FeedbackHub) {
        window.FeedbackHub.identify({
          id: 'user_123',
          email: 'john@example.com',
          name: 'John Smith'
        });
      }
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
    <>
      <Script
        src="${baseUrl}/widget.js"
        data-org="${orgSlug}"
        strategy="afterInteractive"
        onLoad={() => {
          // Optional: Identify user after SDK loads
          if (window.FeedbackHub) {
            window.FeedbackHub.identify({
              id: 'user_123',
              email: 'john@example.com',
              name: 'John Smith'
            });
          }
        }}
      />
    </>
  );
}`
  }

  const identifyCode = `// Identify the logged-in user (Trust Mode)
FeedbackHub.identify({
  id: 'user_123',          // Required: unique user ID
  email: 'john@example.com', // Required: user email
  name: 'John Smith',        // Optional: display name
  avatar: 'https://...',    // Optional: avatar URL
  company: {                 // Optional: company data
    id: 'company_456',
    name: 'Acme Corp',
    plan: 'enterprise'
  }
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

  const jwtFrontendCode = `<!-- Load widget SDK -->
<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
></script>

<script>
// Fetch token from your server
async function initFeedbackHub() {
  const response = await fetch('/api/feedbackhub-token');
  const { token } = await response.json();
  
  // Identify with JWT token
  FeedbackHub.identify({
    token: token
  });
}

// Wait for SDK to load, then identify
if (window.FeedbackHub) {
  initFeedbackHub();
} else {
  window.addEventListener('load', initFeedbackHub);
}
</script>`

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
              <a href="#widget-types" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Widget Types
              </a>
              <a href="#feedback-widget" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Feedback Widget
              </a>
              <a href="#changelog-widget" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Changelog Widget
              </a>
              <a href="#custom-embeds" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Custom Embeds
              </a>
              <a href="#auto-trigger" className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                Auto-trigger
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
                  <li><strong>Workspace slug</strong> — Your unique workspace identifier (required)</li>
                  <li><strong>SSO Secret</strong> — For secure user identification (optional, only for JWT mode)</li>
                </ul>
                <p className="text-muted-foreground mt-3 text-sm">
                  <strong>Note:</strong> You don&apos;t need a board ID. The widget works with all your boards automatically.
                </p>
              </div>

              <div className="relative pl-12 border-l-2">
                <div className="absolute -left-[13px] top-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  2
                </div>
                <h3 className="font-semibold text-lg mb-2">Add the widget to your site</h3>
                <p className="text-muted-foreground mb-3">
                  Copy and paste the script before the closing <code className="bg-muted px-1.5 py-0.5 rounded text-sm">&lt;/body&gt;</code> tag. Then add a data attribute to any element to trigger the changelog:
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

          {/* Widget Types */}
          <section id="widget-types" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">Widget Types</h2>
            <p className="text-muted-foreground mb-6">
              FeedbackHub supports multiple widget types. Use the <code className="bg-muted px-1.5 py-0.5 rounded text-sm">data-type</code> attribute to specify which widget to load. You can also embed custom buttons or divs that trigger the widgets.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Feedback Widget (Default)</h3>
                <p className="text-muted-foreground mb-3">A floating button that opens a full-screen feedback interface. Or use a custom trigger.</p>
                <Card className="bg-[#1e1e1e] border-gray-800 mb-4">
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{`<!-- Default: Floating button (no trigger needed) -->
<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
></script>

<!-- Or use custom trigger (hides floating button) -->
<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
></script>
<button data-feedbackhub-feedback>Give Feedback</button>`}</code>
                    </pre>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Changelog Popup</h3>
                <p className="text-muted-foreground mb-3">A modal popup showing your product changelog. Can be triggered by a custom button or auto-open on homepage.</p>
                <Card className="bg-[#1e1e1e] border-gray-800 mb-4">
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{`<!-- 1. Add the script -->
<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
></script>

<!-- 2. Add data attribute to any element (Supahub-style) -->
<button data-feedbackhub-changelog-popup>What's New</button>
<!-- or -->
<a href="#" data-feedbackhub-changelog-popup>Changelog</a>
<!-- or -->
<div data-feedbackhub-changelog-popup style="cursor: pointer;">📢 Updates</div>`}</code>
                    </pre>
                  </div>
                </Card>
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> The widget automatically detects elements with <code className="bg-muted px-1.5 py-0.5 rounded text-sm">data-feedbackhub-changelog-popup</code> and attaches click handlers. No IDs needed!
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Changelog Dropdown</h3>
                <p className="text-muted-foreground mb-3">A dropdown panel attached to a button element.</p>
                <Card className="bg-[#1e1e1e] border-gray-800">
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{`<!-- 1. Add the script -->
<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
></script>

<!-- 2. Add data attribute to any element -->
<button data-feedbackhub-changelog-dropdown>What's New</button>`}</code>
                    </pre>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">All-in-One Popup</h3>
                <p className="text-muted-foreground mb-3">Combines feedback board and changelog in a centered modal.</p>
                <Card className="bg-[#1e1e1e] border-gray-800">
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{`<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="all-in-one-popup"
></script>`}</code>
                    </pre>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">All-in-One Popover</h3>
                <p className="text-muted-foreground mb-3">Combines feedback board and changelog in a side panel.</p>
                <Card className="bg-[#1e1e1e] border-gray-800">
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{`<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="all-in-one-popover"
></script>`}</code>
                    </pre>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Announcement Banner</h3>
                <p className="text-muted-foreground mb-3">A customizable banner that can link to your changelog or custom URL.</p>
                <Card className="bg-[#1e1e1e] border-gray-800">
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{`<!-- Announcement Banner (opens changelog popup) -->
<a href="#" id="feedbackhub-announcement-trigger" class="feedbackhub-announcement">
  <span>New</span>
  <span>Check out our latest updates</span>
</a>

<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="changelog-popup"
  data-trigger="feedbackhub-announcement-trigger"
></script>`}</code>
                    </pre>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          <hr className="my-12" />

          {/* Custom Button/Div Embeds */}
          <section id="custom-embeds" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">Custom Button & Div Embeds</h2>
            <p className="text-muted-foreground mb-6">
              You can use any button or div element on your website to trigger the changelog popup. Just add an ID to your element and reference it in the <code className="bg-muted px-1.5 py-0.5 rounded text-sm">data-trigger</code> attribute.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Using a Button</h3>
                <Card className="bg-[#1e1e1e] border-gray-800 mb-4">
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{`<!-- Your custom button -->
<button id="my-changelog-btn" class="btn-primary">
  What's New
</button>

<!-- Widget script -->
<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="changelog-popup"
  data-trigger="my-changelog-btn"
></script>`}</code>
                    </pre>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Using a Div</h3>
                <Card className="bg-[#1e1e1e] border-gray-800 mb-4">
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{`<!-- Your custom div (can be styled however you want) -->
<div 
  id="changelog-trigger" 
  style="cursor: pointer; padding: 12px; background: #7c3aed; color: white; border-radius: 8px;"
>
  📢 See What's New
</div>

<!-- Widget script -->
<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="changelog-popup"
  data-trigger="changelog-trigger"
></script>`}</code>
                    </pre>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Using a Link</h3>
                <Card className="bg-[#1e1e1e] border-gray-800">
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-sm text-gray-300 font-mono">
                      <code>{`<!-- Your custom link -->
<a href="#" id="whats-new-link" class="nav-link">
  What's New
</a>

<!-- Widget script -->
<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="changelog-popup"
  data-trigger="whats-new-link"
></script>`}</code>
                    </pre>
                  </div>
                </Card>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Note:</strong> The widget will automatically prevent the default link behavior when clicked.
                </p>
              </div>
            </div>
          </section>

          <hr className="my-12" />

          {/* Auto-trigger on Page Load */}
          <section id="auto-trigger" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">Auto-trigger on Homepage</h2>
            <p className="text-muted-foreground mb-6">
              Automatically open the changelog popup when users visit your homepage. Perfect for announcing new features or updates!
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
              <div className="text-blue-600 text-xl">ℹ️</div>
              <div>
                <div className="font-semibold text-blue-900 mb-1">How it works</div>
                <p className="text-sm text-blue-700">
                  The widget checks if the current page URL matches your configured homepage URL. If it matches, the changelog popup opens automatically. The popup only shows once per browser session to avoid annoying users.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-3">Setup</h3>
            <p className="text-muted-foreground mb-4">
              Enable auto-trigger in your dashboard:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4 mb-6">
              <li>Go to <strong>Widgets</strong> → <strong>Changelog Widget</strong> → <strong>Settings</strong></li>
              <li>Enable <strong>"Auto-trigger on Homepage"</strong></li>
              <li>Enter your homepage URL (e.g., <code className="bg-muted px-1.5 py-0.5 rounded text-sm">https://example.com</code> or <code className="bg-muted px-1.5 py-0.5 rounded text-sm">https://example.com/</code>)</li>
              <li>Save settings</li>
            </ol>

            <h3 className="text-xl font-semibold mt-8 mb-3">Implementation</h3>
            <p className="text-muted-foreground mb-4">
              Just add the changelog popup widget to your homepage. The auto-trigger is controlled by your dashboard settings:
            </p>

            <Card className="bg-[#1e1e1e] border-gray-800">
              <div className="flex items-center justify-end p-3 border-b border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-400 hover:text-white"
                  onClick={() => copyCode(`<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="changelog-popup"
></script>`, 'auto-trigger')}
                >
                  {copiedCode === 'auto-trigger' ? (
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
                  <code>{`<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="changelog-popup"
></script>`}</code>
                </pre>
              </div>
            </Card>

            <h3 className="text-xl font-semibold mt-8 mb-3">Important Notes</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>The popup only shows <strong>once per browser session</strong> (uses sessionStorage)</li>
              <li>URL matching is case-insensitive and ignores trailing slashes</li>
              <li>Works with both <code className="bg-muted px-1.5 py-0.5 rounded text-sm">https://example.com</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-sm">https://example.com/</code></li>
              <li>Query parameters are ignored when matching URLs</li>
            </ul>
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
              Simply load the widget without calling <code className="bg-muted px-1.5 py-0.5 rounded text-sm">FeedbackHub.identify()</code>:
            </p>

            <Card className="bg-[#1e1e1e] border-gray-800">
              <div className="flex items-center justify-end p-3 border-b border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-400 hover:text-white"
                  onClick={() => copyCode(`<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
></script>`, 'guest')}
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
                  <code>{`<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
></script>`}</code>
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
                <h3 className="text-xl font-semibold mb-3">Script Attributes</h3>
                <p className="text-muted-foreground mb-4">
                  The widget SDK is initialized via a script tag with data attributes. No JavaScript initialization needed!
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Attribute</th>
                        <th className="text-left p-3 font-semibold">Type</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">
                          <code className="bg-muted px-1.5 py-0.5 rounded">data-org</code>{' '}
                          <Badge variant="destructive" className="ml-2">Required</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">string</td>
                        <td className="p-3 text-muted-foreground">Your workspace slug</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">
                          <code className="bg-muted px-1.5 py-0.5 rounded">data-type</code>
                          <Badge variant="secondary" className="ml-2">Optional</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">string</td>
                        <td className="p-3 text-muted-foreground">
                          Widget type: <code className="bg-muted px-1.5 py-0.5 rounded">'feedback'</code> (default) | <code className="bg-muted px-1.5 py-0.5 rounded">'changelog-popup'</code> | <code className="bg-muted px-1.5 py-0.5 rounded">'changelog-dropdown'</code> | <code className="bg-muted px-1.5 py-0.5 rounded">'all-in-one-popup'</code> | <code className="bg-muted px-1.5 py-0.5 rounded">'all-in-one-popover'</code>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">
                          <code className="bg-muted px-1.5 py-0.5 rounded">data-trigger</code>
                          <Badge variant="secondary" className="ml-2">Optional</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">string</td>
                        <td className="p-3 text-muted-foreground">ID of a custom button element to trigger the widget (for changelog-popup)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub.identify(data)</code>
                </h3>
                <p className="text-muted-foreground mb-4">
                  Identify the current user. Can use direct user data (Trust mode) or a JWT token (SSO mode).
                </p>
                <p className="text-muted-foreground text-sm mb-2">
                  <strong>Trust Mode:</strong> Pass user object with <code className="bg-muted px-1.5 py-0.5 rounded">id</code> and <code className="bg-muted px-1.5 py-0.5 rounded">email</code>
                </p>
                <p className="text-muted-foreground text-sm">
                  <strong>JWT Mode:</strong> Pass object with <code className="bg-muted px-1.5 py-0.5 rounded">token</code> property
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub.clearIdentity()</code>
                </h3>
                <p className="text-muted-foreground">Clear the current user identity. Call this when the user logs out.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub.open()</code>
                </h3>
                <p className="text-muted-foreground">Programmatically open the widget.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub.close()</code>
                </h3>
                <p className="text-muted-foreground">Programmatically close the widget.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub.getUser()</code>
                </h3>
                <p className="text-muted-foreground">Get the currently identified user object.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">FeedbackHub.isIdentified()</code>
                </h3>
                <p className="text-muted-foreground">Check if a user is currently identified. Returns <code className="bg-muted px-1.5 py-0.5 rounded">true</code> or <code className="bg-muted px-1.5 py-0.5 rounded">false</code>.</p>
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

            <p className="text-muted-foreground mb-4">
              The widget communicates via <code className="bg-muted px-1.5 py-0.5 rounded text-sm">postMessage</code> API. You can listen for messages from the widget iframe:
            </p>

            <Card className="bg-[#1e1e1e] border-gray-800 mb-6">
              <div className="flex items-center justify-end p-3 border-b border-gray-700">
                <span className="text-xs text-gray-400">JavaScript</span>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono">
                  <code>{`// Listen for widget close events
window.addEventListener('message', function(e) {
  if (e.data === 'feedbackhub:close') {
    console.log('Widget closed');
    // Your code here
  }
  
  if (e.data === 'feedbackhub:close-changelog') {
    console.log('Changelog popup closed');
    // Your code here
  }
});

// Programmatically control the widget
FeedbackHub.open();  // Open widget
FeedbackHub.close(); // Close widget

// For changelog widgets
FeedbackHubChangelog.open();  // Open changelog
FeedbackHubChangelog.close(); // Close changelog`}</code>
                </pre>
              </div>
            </Card>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Message</th>
                    <th className="text-left p-3 font-semibold">Source</th>
                    <th className="text-left p-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">'feedbackhub:close'</code>
                    </td>
                    <td className="p-3 text-muted-foreground">Widget iframe</td>
                    <td className="p-3 text-muted-foreground">Widget requests to close</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded">'feedbackhub:close-changelog'</code>
                    </td>
                    <td className="p-3 text-muted-foreground">Changelog iframe</td>
                    <td className="p-3 text-muted-foreground">Changelog popup requests to close</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <hr className="my-12" />

          {/* Feedback Widget */}
          <section id="feedback-widget" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">Feedback Widget</h2>
            <p className="text-muted-foreground mb-6">
              The default feedback widget creates a floating button that opens a full-screen feedback interface where users can browse boards, submit feedback, and view existing posts.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-3">Default Behavior</h3>
            <p className="text-muted-foreground mb-4">
              When you load the widget without specifying a <code className="bg-muted px-1.5 py-0.5 rounded text-sm">data-type</code>, it defaults to the feedback widget:
            </p>

            <Card className="bg-[#1e1e1e] border-gray-800">
              <div className="flex items-center justify-end p-3 border-b border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-400 hover:text-white"
                  onClick={() => copyCode(`<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
></script>`, 'feedback-default')}
                >
                  {copiedCode === 'feedback-default' ? (
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
                  <code>{`<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
></script>`}</code>
                </pre>
              </div>
            </Card>

            <h3 className="text-xl font-semibold mt-8 mb-3">What it creates</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>A floating button in the bottom-right corner (customizable position)</li>
              <li>Full-screen iframe when clicked, showing all your feedback boards</li>
              <li>Users can browse boards, submit new feedback, and vote on existing posts</li>
              <li>Settings (colors, position, branding) are loaded from your dashboard</li>
            </ul>
          </section>

          <hr className="my-12" />

          {/* Changelog Widget */}
          <section id="changelog-widget" className="mb-16 scroll-mt-8">
            <h2 className="text-3xl font-semibold mb-4 pb-3 border-b">Changelog Widget</h2>
            <p className="text-muted-foreground mb-6">
              Display your product updates and announcements to users via a popup modal or dropdown panel.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-3">Popup Mode</h3>
            <p className="text-muted-foreground mb-4">
              Shows a centered modal with your changelog entries. Can be triggered by a custom button:
            </p>

            <Card className="bg-[#1e1e1e] border-gray-800 mb-6">
              <div className="flex items-center justify-end p-3 border-b border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-400 hover:text-white"
                  onClick={() => copyCode(`<button id="my-changelog-btn">What's New</button>

<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="changelog-popup"
  data-trigger="my-changelog-btn"
></script>`, 'changelog-popup')}
                >
                  {copiedCode === 'changelog-popup' ? (
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
                  <code>{`<button id="my-changelog-btn">What's New</button>

<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="changelog-popup"
  data-trigger="my-changelog-btn"
></script>`}</code>
                </pre>
              </div>
            </Card>

            <h3 className="text-xl font-semibold mt-8 mb-3">Dropdown Mode</h3>
            <p className="text-muted-foreground mb-4">
              Shows a dropdown panel attached to a button element:
            </p>

            <Card className="bg-[#1e1e1e] border-gray-800">
              <div className="flex items-center justify-end p-3 border-b border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-400 hover:text-white"
                  onClick={() => copyCode(`<button id="feedbackhub-changelog-trigger">What's New</button>

<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="changelog-dropdown"
></script>`, 'changelog-dropdown')}
                >
                  {copiedCode === 'changelog-dropdown' ? (
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
                  <code>{`<button id="feedbackhub-changelog-trigger">What's New</button>

<script 
  src="${baseUrl}/widget.js" 
  data-org="${orgSlug}"
  data-type="changelog-dropdown"
></script>`}</code>
                </pre>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  )
}
