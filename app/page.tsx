'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="min-h-screen">
      <header 
        className={`sticky top-4 z-50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-4 mx-4 mt-4 rounded-3xl border-2 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-[0_10px_40px_rgba(250,204,21,0.2)]' 
            : 'bg-white border-gray-200 shadow-[0_10px_40px_rgba(250,204,21,0.15)]'
        }`}
      >
        <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-raleway), sans-serif', fontWeight: 700 }}>Example</div>
        <nav className="flex items-center gap-6 text-sm font-semibold" style={{ fontFamily: 'var(--font-raleway), sans-serif' }}>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-gray-700 hover:text-gray-900 font-semibold">
              Features
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link href="#features">Feedback Boards</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#roadmap">Product Roadmap</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#catalog">Product Catalog</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="#demo" className="text-gray-700 hover:text-gray-900 font-semibold">Demo</Link>
          <Link href="/pricing" className="text-gray-700 hover:text-gray-900 font-semibold">Pricing</Link>
          <Link href="#changelog" className="text-gray-700 hover:text-gray-900 font-semibold">Changelog</Link>
        </nav>
        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button 
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold"
            asChild
          >
            <Link href="/signup">Sign up for free</Link>
          </Button>
        </div>
      </header>

      <section className="relative px-8 py-8 md:py-12 text-center bg-gradient-to-b from-white to-yellow-50/30 overflow-hidden">
        {/* Subtle yellow background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-100/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-100/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-yellow-200 bg-white mb-4 mt-4">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              FEEDBACK · ROADMAP · CHANGELOG
            </span>
          </div>

          {/* Headline with yellow light effect */}
          <h1 className="mb-4 text-gray-900 leading-tight max-w-xl mx-auto" style={{ fontFamily: 'Inter, sans-serif', fontSize: '56px', fontWeight: 400 }}>
            <span className="relative inline-block">
              <span className="relative z-10">
                The <span className="italic font-normal text-gray-500" style={{ fontFamily: 'var(--font-libre-baskerville), serif' }}>simplest</span> way to collect feedback and ship what users want
              </span>
              {/* Yellow light ray effect - like light falling on text */}
              <span
                className="absolute inset-0 bg-gradient-to-br from-yellow-300/50 via-yellow-200/30 to-transparent blur-2xl opacity-70 pointer-events-none"
                style={{
                  transform: 'translateY(10%) translateX(10%)',
                  width: '120%',
                  height: '150%'
                }}
              ></span>
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-4 font-medium leading-relaxed">
            From user request to shipped feature, track it all. No complexity, no per-seat pricing, no nonsense.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-12 py-8 text-xl rounded-lg"
              style={{ fontFamily: 'Inter, sans-serif' }}
              asChild
            >
              <Link href="/signup">Start free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold px-12 py-8 text-xl rounded-lg"
              style={{ fontFamily: 'Inter, sans-serif' }}
              asChild
            >
              <Link href="#features">See it in action</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="px-8 py-16 bg-muted/40">
        <h2 className="text-2xl font-semibold text-center mb-10">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6 bg-background">
            <h3 className="font-semibold mb-2">Feedback Boards</h3>
            <p className="text-sm text-muted-foreground">
              Collect and prioritize product feedback in one place.
            </p>
          </div>
          <div className="border rounded-lg p-6 bg-background">
            <h3 className="font-semibold mb-2">Public Roadmap</h3>
            <p className="text-sm text-muted-foreground">
              Share what you are building and keep users informed.
            </p>
          </div>
          <div className="border rounded-lg p-6 bg-background">
            <h3 className="font-semibold mb-2">Changelog</h3>
            <p className="text-sm text-muted-foreground">
              Announce updates and celebrate shipped features.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-8 py-16">
        <h2 className="text-2xl font-semibold text-center mb-10">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Free</h3>
            <p className="text-2xl font-bold mb-4">$0</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>1 board</li>
              <li>Basic roadmap</li>
              <li>Community support</li>
            </ul>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Starter</h3>
            <p className="text-2xl font-bold mb-4">$19</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>3 boards</li>
              <li>Public roadmap</li>
              <li>Email support</li>
            </ul>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Pro</h3>
            <p className="text-2xl font-bold mb-4">$39</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Unlimited boards</li>
              <li>Changelog tools</li>
              <li>Priority support</li>
            </ul>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Business</h3>
            <p className="text-2xl font-bold mb-4">$99</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Team access</li>
              <li>Custom branding</li>
              <li>Dedicated success</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="px-8 py-8 border-t text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} FeedbackHub. All rights reserved.
      </footer>
    </main>
  )
}
