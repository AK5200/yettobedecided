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
import { ChevronDown, Check } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PricingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'yearly' | 'monthly'>('yearly')
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set())

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0')
            setVisibleCards((prev) => new Set(prev).add(cardIndex))
          }
        })
      },
      { threshold: 0.1 }
    )

    const cards = document.querySelectorAll('[data-card-index]')
    cards.forEach((card) => observer.observe(card))

    return () => {
      cards.forEach((card) => observer.unobserve(card))
    }
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
        <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-raleway), sans-serif', fontWeight: 700 }}>
          <Link href="/">FeedbackHub</Link>
        </div>
        <nav className="flex items-center gap-6 text-sm font-semibold" style={{ fontFamily: 'var(--font-raleway), sans-serif' }}>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-gray-700 hover:text-gray-900 font-semibold">
              Features
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link href="/#features">Feedback Boards</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/#roadmap">Product Roadmap</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/#catalog">Product Catalog</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/#demo" className="text-gray-700 hover:text-gray-900 font-semibold">Demo</Link>
          <Link href="/pricing" className="text-gray-700 hover:text-gray-900 font-semibold">Pricing</Link>
          <Link href="/#changelog" className="text-gray-700 hover:text-gray-900 font-semibold">Changelog</Link>
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
              <Link href="#pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-20 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-4xl font-bold text-center mb-3" style={{ fontFamily: 'var(--font-raleway), sans-serif' }}>
            Choose the Perfect Plan for You
          </h2>
          <p className="text-center text-gray-500 mb-10 font-medium text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
            Simple, transparent pricing. No per-seat fees.
          </p>

          <div className="flex justify-center mb-14">
            <Tabs value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as 'yearly' | 'monthly')} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="yearly" className="font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Yearly <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Save 2 months</span>
                </TabsTrigger>
                <TabsTrigger value="monthly" className="font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Monthly
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Free Plan */}
            <div
              data-card-index="0"
              className={`flex flex-col rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                visibleCards.has(0) ? 'animate-slide-in-left opacity-100' : 'opacity-0 translate-x-[-50px]'
              }`}
            >
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-raleway), sans-serif' }}>FREE</h3>
              <p className="text-sm text-gray-400 mb-4">Best for personal use.</p>

              <div className="mb-6 h-16 flex items-end">
                <span className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }}>$0</span>
                <span className="text-gray-500 ml-2 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>/mo</span>
              </div>

              <Button
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl py-6"
                style={{ fontFamily: 'Inter, sans-serif' }}
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>

              <div className="border-t border-gray-100 mt-6 pt-5 flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>What you will get</p>
                <ul className="text-sm text-gray-700 space-y-2.5 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>3 Feedback Boards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>2 Admins</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Unlimited End Users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Public Roadmap</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Changelog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Basic Widget</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Starter Plan */}
            <div
              data-card-index="1"
              className={`flex flex-col rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                visibleCards.has(1) ? 'animate-slide-in-left opacity-100' : 'opacity-0 translate-x-[-50px]'
              }`}
            >
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-raleway), sans-serif' }}>STARTER</h3>
              <p className="text-sm text-gray-400 mb-4">Best for small teams.</p>

              <div className="mb-6 h-16 flex items-end">
                {billingPeriod === 'yearly' ? (
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }}>$16</span>
                      <span className="text-gray-500 ml-2 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>/month</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>billed yearly</p>
                  </div>
                ) : (
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }}>$19</span>
                    <span className="text-gray-500 ml-2 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>/mo</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl py-6"
                style={{ fontFamily: 'Inter, sans-serif' }}
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>

              <div className="border-t border-gray-100 mt-6 pt-5 flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>What you will get</p>
                <ul className="text-sm text-gray-700 space-y-2.5 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>5 Feedback Boards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>5 Admins</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Unlimited End Users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Public Roadmap</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Changelog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>All Widgets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Private Boards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Custom Branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Custom Domain</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Email Notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Slack & Discord</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan — Highlighted */}
            <div
              data-card-index="2"
              className={`flex flex-col relative rounded-2xl p-7 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
                visibleCards.has(2) ? 'animate-slide-in-right opacity-100' : 'opacity-0 translate-x-[50px]'
              }`}
              style={{
                background: 'linear-gradient(165deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
                boxShadow: '0 25px 60px rgba(15, 52, 96, 0.3)'
              }}
            >
              <div className="absolute -top-3 right-5 z-10">
                <span className="text-xs font-bold bg-yellow-400 text-gray-900 px-3 py-1 rounded-full shadow-lg">Popular</span>
              </div>

              <h3 className="text-xl font-bold mb-2 text-white" style={{ fontFamily: 'var(--font-raleway), sans-serif' }}>PRO</h3>
              <p className="text-sm text-gray-400 mb-4">For growing teams & companies.</p>

              <div className="mb-6 h-16 flex items-end">
                {billingPeriod === 'yearly' ? (
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold tabular-nums text-white" style={{ fontFamily: 'Inter, sans-serif' }}>$33</span>
                      <span className="text-gray-400 ml-2 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>/month</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>billed yearly</p>
                  </div>
                ) : (
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold tabular-nums text-white" style={{ fontFamily: 'Inter, sans-serif' }}>$39</span>
                    <span className="text-gray-400 ml-2 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>/mo</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl py-6"
                style={{ fontFamily: 'Inter, sans-serif' }}
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>

              <div className="border-t border-white/10 mt-6 pt-5 flex-1">
                <p className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>What you will get</p>
                <ul className="text-sm text-white space-y-2.5 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Unlimited Boards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>15 Admins</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Unlimited End Users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Public Roadmap</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Changelog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>All Widgets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Private Boards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Custom Branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Custom Domain</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Email Notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Slack & Discord</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Jira & Linear</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>API & Webhooks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>SSO/SAML</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <span>Custom CSS</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Scale Plan */}
            <div
              data-card-index="3"
              className={`flex flex-col rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                visibleCards.has(3) ? 'animate-slide-in-right opacity-100' : 'opacity-0 translate-x-[50px]'
              }`}
            >
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-raleway), sans-serif' }}>SCALE</h3>
              <p className="text-sm text-gray-400 mb-4">Best for large organizations.</p>

              <div className="mb-6 h-16 flex items-end">
                {billingPeriod === 'yearly' ? (
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }}>$83</span>
                      <span className="text-gray-500 ml-2 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>/month</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>billed yearly</p>
                  </div>
                ) : (
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }}>$99</span>
                    <span className="text-gray-500 ml-2 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>/mo</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl py-6"
                style={{ fontFamily: 'Inter, sans-serif' }}
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>

              <div className="border-t border-gray-100 mt-6 pt-5 flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>What you will get</p>
                <ul className="text-sm text-gray-700 space-y-2.5 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Unlimited Boards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Unlimited Admins</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Unlimited End Users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Public Roadmap</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Changelog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>All Widgets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Private Boards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Custom Branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Custom Domain</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Email Notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Slack & Discord</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Jira & Linear</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>API & Webhooks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>SSO/SAML</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Custom CSS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>User Segmentation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>AI Insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Revenue Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Dedicated Support</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      <footer className="px-8 py-8 border-t text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} FeedbackHub. All rights reserved.
      </footer>
    </main>
  )
}
