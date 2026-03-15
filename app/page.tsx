'use client'

import { useState } from 'react'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || "You're on the list!")
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-white relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-yellow-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Logo */}
        <h1
          className="text-5xl font-bold text-gray-900 mb-6"
          style={{ fontFamily: 'var(--font-raleway), sans-serif' }}
        >
          Kelo
        </h1>

        {/* Headline */}
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-snug">
          Build with your users,<br />not assumptions.
        </h2>

        {/* Description */}
        <p className="text-base text-gray-500 mb-3 leading-relaxed max-w-md mx-auto">
          Collect feedback, prioritize requests, and keep users updated on what your team is building.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Complete transparency between SaaS teams and their users.
        </p>

        {/* Waitlist form */}
        {status === 'success' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-5">
            <p className="text-emerald-700 font-semibold text-base">{message}</p>
            <p className="text-emerald-600 text-sm mt-1">We'll notify you as soon as Kelo goes live.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
              Join the waitlist for early access
            </p>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 h-12 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="h-12 px-6 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {status === 'loading' ? 'Joining...' : 'Notify me when Kelo goes live'}
              </button>
            </form>
          </>
        )}

        {status === 'error' && (
          <p className="text-red-500 text-sm mt-3">{message}</p>
        )}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Kelo. All rights reserved.
      </footer>
    </main>
  )
}
