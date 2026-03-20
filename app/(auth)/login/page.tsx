'use client'

import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import Link from 'next/link'

function DashboardIllustration({ isDark }: { isDark: boolean }) {
  const textColor = isDark ? '#ffffff' : '#0f0f0f';
  const mutedColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,15,15,0.45)';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,15,15,0.08)';
  const cardShadow = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)';
  const panelBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,15,15,0.07)';

  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[560px]">
      <rect x="40" y="20" width="400" height="260" rx="14" fill={panelBg} stroke={panelBorder} strokeWidth="1.2" filter={`drop-shadow(0 8px 32px ${cardShadow})`} />
      <rect x="40" y="20" width="400" height="32" rx="14" fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,15,15,0.04)'} />
      <rect x="40" y="38" width="400" height="14" fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,15,15,0.04)'} />
      <circle cx="62" cy="36" r="5" fill="rgba(239,68,68,0.7)" />
      <circle cx="78" cy="36" r="5" fill="rgba(245,197,24,0.7)" />
      <circle cx="94" cy="36" r="5" fill="rgba(34,197,94,0.7)" />
      <rect x="160" y="28" width="160" height="16" rx="8" fill={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,15,15,0.06)'} />
      <text x="240" y="39" textAnchor="middle" fontSize="7" fill={mutedColor}>app.kelohq.com/dashboard</text>
      <rect x="40" y="52" width="72" height="228" rx="0" fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,15,15,0.03)'} />
      <rect x="52" y="64" width="20" height="20" rx="5" fill="#F5C518" />
      <text x="62" y="77" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f0f0f">K</text>
      {[
        { y: 100, label: '⊞', active: true },
        { y: 120, label: '◎', active: false },
        { y: 140, label: '⚑', active: false },
        { y: 160, label: '↗', active: false },
      ].map((item, i) => (
        <g key={i}>
          {item.active && <rect x="48" y={item.y - 7} width="48" height="16" rx="6" fill="rgba(245,197,24,0.15)" />}
          <text x="72" y={item.y + 4} textAnchor="middle" fontSize="10" fill={item.active ? '#F5C518' : mutedColor}>{item.label}</text>
        </g>
      ))}
      <text x="128" y="74" fontSize="11" fontWeight="700" fill={textColor}>Good morning, Alex 👋</text>
      <text x="128" y="86" fontSize="7.5" fill={mutedColor}>Here&apos;s what&apos;s happening with your product</text>
      <rect x="128" y="96" width="88" height="52" rx="8" fill={cardBg} stroke={cardBorder} strokeWidth="1" filter={`drop-shadow(0 2px 6px ${cardShadow})`} />
      <text x="138" y="110" fontSize="7" fill={mutedColor}>Total Feedback</text>
      <text x="138" y="126" fontSize="18" fontWeight="800" fill={textColor}>1,284</text>
      <rect x="138" y="132" width="32" height="8" rx="4" fill="rgba(34,197,94,0.15)" />
      <text x="154" y="138" textAnchor="middle" fontSize="6" fontWeight="600" fill="#16a34a">↑ 12%</text>
      <rect x="224" y="96" width="88" height="52" rx="8" fill={cardBg} stroke={cardBorder} strokeWidth="1" filter={`drop-shadow(0 2px 6px ${cardShadow})`} />
      <text x="234" y="110" fontSize="7" fill={mutedColor}>Open Issues</text>
      <text x="234" y="126" fontSize="18" fontWeight="800" fill={textColor}>47</text>
      <rect x="234" y="132" width="36" height="8" rx="4" fill="rgba(239,68,68,0.12)" />
      <text x="252" y="138" textAnchor="middle" fontSize="6" fontWeight="600" fill="#dc2626">↑ 3 new</text>
      <rect x="320" y="96" width="88" height="52" rx="8" fill={cardBg} stroke={cardBorder} strokeWidth="1" filter={`drop-shadow(0 2px 6px ${cardShadow})`} />
      <text x="330" y="110" fontSize="7" fill={mutedColor}>Shipped</text>
      <text x="330" y="126" fontSize="18" fontWeight="800" fill={textColor}>23</text>
      <rect x="330" y="132" width="40" height="8" rx="4" fill="rgba(245,197,24,0.2)" />
      <text x="350" y="138" textAnchor="middle" fontSize="6" fontWeight="600" fill="#b8920a">this month</text>
      <text x="128" y="162" fontSize="8.5" fontWeight="700" fill={textColor}>Recent Activity</text>
      {[
        { y: 172, dot: '#F5C518', label: 'Dark mode request', sub: 'upvoted by 12 users', time: '2m ago' },
        { y: 192, dot: 'rgba(34,197,94,0.9)', label: 'v2.4 shipped 🚀', sub: 'changelog published', time: '1h ago' },
        { y: 212, dot: 'rgba(239,68,68,0.8)', label: 'Safari login bug', sub: 'marked as resolved', time: '3h ago' },
        { y: 232, dot: 'rgba(99,102,241,0.8)', label: 'New feedback board', sub: 'created by team', time: '1d ago' },
      ].map((item, i) => (
        <g key={i}>
          <circle cx="136" cy={item.y + 4} r="4" fill={item.dot} />
          <text x="146" y={item.y + 7} fontSize="7.5" fontWeight="600" fill={textColor}>{item.label}</text>
          <text x="146" y={item.y + 17} fontSize="6.5" fill={mutedColor}>{item.sub}</text>
          <text x="400" y={item.y + 7} textAnchor="end" fontSize="6.5" fill={mutedColor}>{item.time}</text>
          {i < 3 && <line x1="136" y1={item.y + 8} x2="136" y2={item.y + 20} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,15,15,0.1)'} strokeWidth="1" strokeDasharray="2 2" />}
        </g>
      ))}
      <rect x="128" y="252" width="280" height="20" rx="6" fill={isDark ? 'rgba(245,197,24,0.08)' : 'rgba(245,197,24,0.1)'} stroke="rgba(245,197,24,0.2)" strokeWidth="1" />
      <text x="268" y="265" textAnchor="middle" fontSize="7" fontWeight="600" fill="rgba(245,197,24,0.9)">✓ All systems operational · Last sync 30s ago</text>
      <g filter={`drop-shadow(0 4px 12px ${cardShadow})`}>
        <rect x="310" y="8" width="130" height="36" rx="10" fill={cardBg} stroke="rgba(245,197,24,0.3)" strokeWidth="1" />
        <circle cx="324" cy="26" r="7" fill="rgba(245,197,24,0.9)" />
        <text x="324" y="29" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0f0f0f">!</text>
        <text x="336" y="22" fontSize="7.5" fontWeight="700" fill={textColor}>New feature request</text>
        <text x="336" y="33" fontSize="6.5" fill={mutedColor}>from @sarah · just now</text>
      </g>
      <text x="240" y="300" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(245,197,24,0.7)" letterSpacing="1">YOUR KELO DASHBOARD</text>
    </svg>
  );
}

export default function LoginPage() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const [mounted, setMounted] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const sectionRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    setGoogleLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
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

      {/* LEFT PANEL — Dashboard illustration */}
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
            <DashboardIllustration isDark={isDark} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-display font-extrabold text-kelo-ink dark:text-white leading-tight mb-2">
              Your feedback hub
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">is waiting for you.</span>
                <span className="absolute inset-x-0 bottom-1 h-2.5 -z-0 rounded-sm" style={{ background: 'rgba(245,197,24,0.38)' }} />
              </span>
            </h2>
            <p className="text-sm text-kelo-muted dark:text-white/40 leading-relaxed max-w-xs mx-auto">
              Pick up right where you left off. Your team&apos;s feedback, issues, and shipped features are all here.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Login form */}
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
              Welcome back
            </div>
            <h1 className="text-3xl font-display font-extrabold text-kelo-ink dark:text-white leading-tight tracking-tight mb-2">
              Log in to Kelo
            </h1>
            <p className="text-sm text-kelo-muted dark:text-white/50 leading-relaxed">
              Your feedback board is ready. Sign in to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-kelo-ink dark:text-white/70 tracking-wide">
                Email
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-kelo-ink dark:text-white/70 tracking-wide">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-kelo-muted dark:text-white/40 hover:text-kelo-yellow dark:hover:text-kelo-yellow transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
                  isDark
                    ? 'bg-white/[0.06] border-white/10 text-white placeholder-white/30 focus:border-kelo-yellow/50 focus:bg-white/[0.08]'
                    : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/60 focus:border-kelo-yellow/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,197,24,0.12)]'
                }`}
              />
            </div>

            {/* Error message */}
            {message && (
              <p className="text-sm text-red-500 dark:text-red-400">{message}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 px-6 py-3 rounded-xl text-sm font-semibold bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark transition-all duration-200 shadow-sm hover:shadow-[0_0_20px_rgba(245,197,24,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log in'}
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
            onClick={handleGoogleLogin}
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
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-kelo-ink dark:text-white font-semibold hover:text-kelo-yellow dark:hover:text-kelo-yellow transition-colors"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
