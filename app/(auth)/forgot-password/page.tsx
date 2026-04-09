'use client'

import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const [mounted, setMounted] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const sectionRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Failed to send reset email')
        setSuccess(false)
      } else {
        setMessage(data.message || 'Password reset email sent! Please check your inbox.')
        setSuccess(true)
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to send reset email')
      setSuccess(false)
    }

    setLoading(false)
  }

  return (
    <div
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center bg-white dark:bg-[#080808] transition-colors duration-300 overflow-hidden px-6 py-12"
    >
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 60% 50% at ${mousePos.x}% ${mousePos.y}%, rgba(245,197,24,0.09) 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-kelo-yellow flex items-center justify-center shadow-sm group-hover:shadow-[0_0_12px_rgba(245,197,24,0.5)] transition-shadow duration-200">
              <span className="text-kelo-ink font-display font-extrabold text-sm leading-none">K</span>
            </div>
            <span className="font-display font-bold text-kelo-ink dark:text-white text-lg tracking-tight">Kelo</span>
          </Link>
          {mounted && (
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
          )}
        </div>

        {/* Heading */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-kelo-yellow/35 bg-kelo-yellow-light dark:bg-kelo-yellow/10 text-xs font-mono font-semibold text-kelo-yellow-dark tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow animate-pulse-slow inline-block" />
            Account recovery
          </div>
          <h1 className="text-3xl font-display font-extrabold text-kelo-ink dark:text-white leading-tight tracking-tight mb-2">
            Reset your password
          </h1>
          <p className="text-sm text-kelo-muted dark:text-white/50 leading-relaxed">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Form */}
        {!success ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            {message && !success && (
              <p className="text-sm text-red-500 dark:text-red-400">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 px-6 py-3 rounded-xl text-sm font-semibold bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark transition-all duration-200 shadow-sm hover:shadow-[0_0_20px_rgba(245,197,24,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${
            isDark ? 'bg-kelo-yellow/10 border-kelo-yellow/25' : 'bg-kelo-yellow-light border-kelo-yellow/30'
          }`}>
            <div className="w-8 h-8 rounded-full bg-kelo-yellow flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-kelo-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-kelo-ink dark:text-white">Check your email</p>
              <p className="text-xs text-kelo-muted dark:text-white/50 mt-0.5">{message}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-kelo-muted dark:text-white/40 mt-6">
          Remember your password?{' '}
          <Link
            href="/login"
            className="text-kelo-ink dark:text-white font-semibold hover:text-kelo-yellow dark:hover:text-kelo-yellow transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
