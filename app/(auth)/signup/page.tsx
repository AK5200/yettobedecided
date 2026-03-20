'use client'

import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import Link from 'next/link'

function FeedbackLoopIllustration({ isDark }: { isDark: boolean }) {
  const textColor = isDark ? '#ffffff' : '#0f0f0f';
  const mutedColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,15,15,0.45)';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,15,15,0.08)';
  const cardShadow = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)';

  return (
    <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[560px]">
      {/* User 1 — feature request */}
      <g>
        <circle cx="52" cy="80" r="20" fill="#F5C518" opacity="0.15" />
        <circle cx="52" cy="80" r="14" fill="#F5C518" opacity="0.9" />
        <text x="52" y="84" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f0f0f">U</text>
        <rect x="72" y="58" width="110" height="46" rx="10" fill={cardBg} stroke={cardBorder} strokeWidth="1" filter={`drop-shadow(0 2px 6px ${cardShadow})`} />
        <polygon points="72,78 64,82 72,86" fill={cardBg} />
        <text x="82" y="76" fontSize="8" fontWeight="700" fill={textColor}>✨ Feature request</text>
        <text x="82" y="88" fontSize="7.5" fill={mutedColor}>Dark mode for mobile</text>
        <rect x="82" y="94" width="38" height="8" rx="4" fill="rgba(245,197,24,0.2)" />
        <text x="101" y="100" textAnchor="middle" fontSize="6.5" fontWeight="600" fill="#b8920a">▲ 24</text>
      </g>

      {/* User 2 — bug report */}
      <g>
        <circle cx="44" cy="170" r="14" fill="rgba(99,102,241,0.8)" />
        <text x="44" y="174" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">S</text>
        <rect x="64" y="150" width="116" height="46" rx="10" fill={cardBg} stroke={cardBorder} strokeWidth="1" filter={`drop-shadow(0 2px 6px ${cardShadow})`} />
        <polygon points="64,168 56,172 64,176" fill={cardBg} />
        <text x="74" y="168" fontSize="8" fontWeight="700" fill={textColor}>🐛 Bug report</text>
        <text x="74" y="180" fontSize="7.5" fill={mutedColor}>Login fails on Safari</text>
        <rect x="74" y="186" width="44" height="8" rx="4" fill="rgba(239,68,68,0.15)" />
        <text x="96" y="192" textAnchor="middle" fontSize="6.5" fontWeight="600" fill="#dc2626">High priority</text>
      </g>

      {/* User 3 — feedback */}
      <g>
        <circle cx="56" cy="258" r="14" fill="rgba(34,197,94,0.8)" />
        <text x="56" y="262" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">M</text>
        <rect x="76" y="238" width="110" height="40" rx="10" fill={cardBg} stroke={cardBorder} strokeWidth="1" filter={`drop-shadow(0 2px 6px ${cardShadow})`} />
        <polygon points="76,254 68,258 76,262" fill={cardBg} />
        <text x="86" y="254" fontSize="8" fontWeight="700" fill={textColor}>💬 Feedback</text>
        <text x="86" y="266" fontSize="7.5" fill={mutedColor}>Love the new UI update!</text>
        <text x="86" y="275" fontSize="8" fill="#F5C518">★★★★★</text>
      </g>

      <text x="90" y="316" textAnchor="middle" fontSize="9" fontWeight="700" fill={mutedColor} letterSpacing="1.5">USERS</text>

      {/* Center: Kelo logo + loop arrow */}
      <g>
        <rect x="210" y="138" width="60" height="42" rx="5" fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,15,15,0.06)'} stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,15,15,0.12)'} strokeWidth="1.2" />
        <rect x="215" y="143" width="50" height="30" rx="3" fill="#ffffff" />
        <text x="240" y="163" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f0f0f" fontFamily="sans-serif">Kelo</text>
        <rect x="205" y="180" width="70" height="5" rx="2.5" fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,15,15,0.1)'} />
        <ellipse cx="240" cy="170" rx="38" ry="28" fill="rgba(245,197,24,0.07)" />
        <path d="M 190 100 Q 215 60 240 138" stroke="rgba(245,197,24,0.55)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" markerEnd="url(#arrowYellow)" />
        <path d="M 240 185 Q 265 220 295 200" stroke="rgba(245,197,24,0.55)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" markerEnd="url(#arrowYellow)" />
        <path d="M 340 270 Q 240 320 140 270" stroke="rgba(99,102,241,0.45)" strokeWidth="1.5" strokeDasharray="4 3" fill="none" markerEnd="url(#arrowPurple)" />
        <defs>
          <marker id="arrowYellow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(245,197,24,0.8)" />
          </marker>
          <marker id="arrowPurple" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(99,102,241,0.7)" />
          </marker>
        </defs>
      </g>

      {/* Right side: Devs */}
      <g>
        <rect x="308" y="192" width="130" height="56" rx="10" fill={cardBg} stroke="rgba(245,197,24,0.3)" strokeWidth="1" filter={`drop-shadow(0 2px 8px ${cardShadow})`} />
        <rect x="318" y="200" width="44" height="10" rx="5" fill="rgba(34,197,94,0.2)" />
        <text x="340" y="208" textAnchor="middle" fontSize="7" fontWeight="700" fill="#16a34a">🚀 SHIPPED</text>
        <text x="318" y="222" fontSize="8.5" fontWeight="700" fill={textColor}>Dark mode — v2.4</text>
        <text x="318" y="233" fontSize="7.5" fill={mutedColor}>Fixed Safari login bug</text>
        <circle cx="410" cy="202" r="3" fill="#F5C518" opacity="0.9" />
        <circle cx="420" cy="210" r="2" fill="rgba(99,102,241,0.8)" />
        <circle cx="405" cy="215" r="2.5" fill="rgba(34,197,94,0.8)" />
        <circle cx="425" cy="200" r="2" fill="rgba(239,68,68,0.7)" />
        <circle cx="415" cy="222" r="1.5" fill="#F5C518" opacity="0.7" />
        <circle cx="326" cy="244" r="10" fill="rgba(99,102,241,0.8)" />
        <text x="326" y="248" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">J</text>
        <circle cx="348" cy="244" r="10" fill="rgba(245,197,24,0.9)" />
        <text x="348" y="248" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f0f0f">R</text>
        <text x="368" y="248" fontSize="14">🎉</text>
      </g>

      <text x="373" y="316" textAnchor="middle" fontSize="9" fontWeight="700" fill={mutedColor} letterSpacing="1.5">DEVS</text>
      <text x="240" y="316" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(245,197,24,0.7)" letterSpacing="1">FEEDBACK LOOP</text>
    </svg>
  );
}

export default function SignupPage() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const [mounted, setMounted] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const sectionRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    setGoogleLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      setMessageType('error')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Failed to create account')
        setMessageType('error')
      } else {
        setMessage(data.message || 'Check your email to confirm your account!')
        setMessageType('success')
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to create account')
      setMessageType('error')
    }

    setLoading(false)
  }

  const ThemeToggleButton = () => {
    if (!mounted) return null
    return (
      <button
        onClick={toggleTheme}
        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 ${
          isDark
            ? 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            : 'border-kelo-border bg-kelo-surface text-kelo-muted hover:bg-kelo-surface-2 hover:text-kelo-ink'
        }`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
      </button>
    )
  }

  return (
    <div
      ref={sectionRef}
      className="min-h-screen flex bg-white dark:bg-[#080808] transition-colors duration-300 overflow-hidden"
    >
      {/* Dynamic radial glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 60% 50% at ${mousePos.x}% ${mousePos.y}%, rgba(245,197,24,0.09) 0%, transparent 70%)`,
        }}
      />

      {/* LEFT PANEL — Feedback loop illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 100% 60% at 50% -5%, rgba(245,197,24,0.16) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,197,24,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.06) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage: 'radial-gradient(ellipse 85% 70% at 50% 30%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 70% at 50% 30%, black 20%, transparent 80%)',
          }}
        />
        <div className="absolute top-32 left-[10%] w-64 h-64 rounded-full bg-kelo-yellow/[0.07] blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-40 right-[8%] w-48 h-48 rounded-full bg-kelo-yellow/[0.09] blur-2xl animate-float pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-kelo-yellow/[0.04] blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center px-10 max-w-lg w-full">
          <div className="w-full flex items-start mb-10">
            <Link href="/" className="font-display font-extrabold text-2xl text-kelo-ink dark:text-white tracking-tight hover:opacity-80 transition-opacity duration-200">
              Kelo
            </Link>
          </div>
          <div className="w-full mb-8 scale-110 origin-center">
            <FeedbackLoopIllustration isDark={isDark} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-display font-extrabold text-kelo-ink dark:text-white leading-tight mb-2">
              Users talk. Devs ship.
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">Everyone celebrates.</span>
                <span className="absolute inset-x-0 bottom-1 h-2.5 -z-0 rounded-sm" style={{ background: 'rgba(245,197,24,0.38)' }} />
              </span>
            </h2>
            <p className="text-sm text-kelo-muted dark:text-white/40 leading-relaxed max-w-xs mx-auto">
              Collect feedback, prioritize what matters, and close the loop with your users.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Signup form */}
      <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-center px-6 py-12 min-h-screen">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between w-full max-w-sm mb-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-kelo-yellow flex items-center justify-center shadow-sm group-hover:shadow-[0_0_12px_rgba(245,197,24,0.5)] transition-shadow duration-200">
              <span className="text-kelo-ink font-display font-extrabold text-sm leading-none">K</span>
            </div>
            <span className="font-display font-bold text-kelo-ink dark:text-white text-lg tracking-tight">Kelo</span>
          </Link>
          <ThemeToggleButton />
        </div>

        {/* Desktop theme toggle */}
        <div className="hidden lg:flex absolute top-6 right-6">
          <ThemeToggleButton />
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-kelo-yellow/35 bg-kelo-yellow-light dark:bg-kelo-yellow/10 text-xs font-mono font-semibold text-kelo-yellow-dark tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow animate-pulse-slow inline-block" />
              Free forever plan
            </div>
            <h1 className="text-3xl font-display font-extrabold text-kelo-ink dark:text-white leading-tight tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-sm text-kelo-muted dark:text-white/50 leading-relaxed">
              Start collecting feedback in minutes. No credit card required.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-kelo-ink dark:text-white/70 tracking-wide">
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
                  isDark
                    ? 'bg-white/[0.06] border-white/10 text-white placeholder-white/30 focus:border-kelo-yellow/50 focus:bg-white/[0.08]'
                    : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/60 focus:border-kelo-yellow/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,197,24,0.12)]'
                }`}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-kelo-ink dark:text-white/70 tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
                  isDark
                    ? 'bg-white/[0.06] border-white/10 text-white placeholder-white/30 focus:border-kelo-yellow/50 focus:bg-white/[0.08]'
                    : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/60 focus:border-kelo-yellow/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,197,24,0.12)]'
                }`}
              />
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-kelo-ink dark:text-white/70 tracking-wide">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={6}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
                  isDark
                    ? 'bg-white/[0.06] border-white/10 text-white placeholder-white/30 focus:border-kelo-yellow/50 focus:bg-white/[0.08]'
                    : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/60 focus:border-kelo-yellow/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,197,24,0.12)]'
                }`}
              />
            </div>

            {/* Message */}
            {message && (
              <p className={`text-sm ${messageType === 'success' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {message}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 px-6 py-3 rounded-xl text-sm font-semibold bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark transition-all duration-200 shadow-sm hover:shadow-[0_0_20px_rgba(245,197,24,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.08]' : 'bg-kelo-border'}`} />
            <span className="text-xs text-kelo-muted dark:text-white/30 font-medium">or</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.08]' : 'bg-kelo-border'}`} />
          </div>

          {/* Google SSO */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white'
                : 'bg-kelo-surface border-kelo-border text-kelo-ink hover:bg-kelo-surface-2'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Footer link */}
          <p className="text-center text-xs text-kelo-muted dark:text-white/40 mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-kelo-ink dark:text-white font-semibold hover:text-kelo-yellow dark:hover:text-kelo-yellow transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
