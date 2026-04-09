'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const [mounted, setMounted] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const sectionRef = useRef<HTMLDivElement>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const supabase = createClient()

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
    setMessage('')

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  const inputClasses = `w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
    isDark
      ? 'bg-white/[0.06] border-white/10 text-white placeholder-white/30 focus:border-kelo-yellow/50 focus:bg-white/[0.08]'
      : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/60 focus:border-kelo-yellow/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,197,24,0.12)]'
  }`

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

        {success ? (
          <>
            {/* Success state */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 text-xs font-mono font-semibold text-green-600 dark:text-green-400 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Success
              </div>
              <h1 className="text-3xl font-display font-extrabold text-kelo-ink dark:text-white leading-tight tracking-tight mb-2">
                Password updated
              </h1>
              <p className="text-sm text-kelo-muted dark:text-white/50 leading-relaxed">
                Your password has been changed successfully. You can now log in with your new password.
              </p>
            </div>

            <Link
              href="/login"
              className="block w-full text-center px-6 py-3 rounded-xl text-sm font-semibold bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark transition-all duration-200 shadow-sm hover:shadow-[0_0_20px_rgba(245,197,24,0.4)]"
            >
              Go to login
            </Link>
          </>
        ) : (
          <>
            {/* Heading */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-kelo-yellow/35 bg-kelo-yellow-light dark:bg-kelo-yellow/10 text-xs font-mono font-semibold text-kelo-yellow-dark tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow animate-pulse-slow inline-block" />
                Secure reset
              </div>
              <h1 className="text-3xl font-display font-extrabold text-kelo-ink dark:text-white leading-tight tracking-tight mb-2">
                Set a new password
              </h1>
              <p className="text-sm text-kelo-muted dark:text-white/50 leading-relaxed">
                Choose a strong password for your account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-kelo-ink dark:text-white/70 tracking-wide">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                    onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className={`${inputClasses} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-kelo-muted hover:text-kelo-ink'}`}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {capsLock && <p className="text-xs text-kelo-yellow-dark dark:text-kelo-yellow">Caps Lock is on</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-kelo-ink dark:text-white/70 tracking-wide">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                    onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                    placeholder="Repeat your password"
                    required
                    minLength={6}
                    className={`${inputClasses} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-kelo-muted hover:text-kelo-ink'}`}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {message && (
                <p className="text-sm text-red-500 dark:text-red-400">{message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 px-6 py-3 rounded-xl text-sm font-semibold bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark transition-all duration-200 shadow-sm hover:shadow-[0_0_20px_rgba(245,197,24,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>

            <p className="text-center text-xs text-kelo-muted dark:text-white/40 mt-6">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-kelo-ink dark:text-white font-semibold hover:text-kelo-yellow dark:hover:text-kelo-yellow transition-colors"
              >
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
