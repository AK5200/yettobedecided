'use client'

import { useState, useEffect } from 'react'

function FloatingK({ delay, duration, startX, startY, size, opacity }: {
  delay: number
  duration: number
  startX: number
  startY: number
  size: number
  opacity: number
}) {
  return (
    <div
      className="absolute pointer-events-none select-none font-bold text-yellow-400/30"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        fontSize: `${size}px`,
        opacity,
        fontFamily: 'var(--font-raleway), sans-serif',
        animation: `floatK ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      K
    </div>
  )
}

const floatingKs = [
  { delay: 0, duration: 18, startX: 8, startY: 15, size: 80, opacity: 0.08 },
  { delay: 2, duration: 22, startX: 85, startY: 10, size: 120, opacity: 0.06 },
  { delay: 4, duration: 20, startX: 15, startY: 70, size: 60, opacity: 0.1 },
  { delay: 1, duration: 25, startX: 75, startY: 65, size: 100, opacity: 0.07 },
  { delay: 3, duration: 19, startX: 50, startY: 5, size: 50, opacity: 0.09 },
  { delay: 5, duration: 23, startX: 30, startY: 85, size: 90, opacity: 0.06 },
  { delay: 2, duration: 21, startX: 92, startY: 40, size: 70, opacity: 0.08 },
  { delay: 0, duration: 24, startX: 5, startY: 45, size: 110, opacity: 0.05 },
  { delay: 4, duration: 17, startX: 60, startY: 80, size: 55, opacity: 0.1 },
  { delay: 1, duration: 20, startX: 40, startY: 30, size: 65, opacity: 0.07 },
]

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <>
      <style jsx global>{`
        @keyframes floatK {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-30px) rotate(5deg);
          }
          50% {
            transform: translateY(-15px) rotate(-3deg);
          }
          75% {
            transform: translateY(-40px) rotate(4deg);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.4);
          }
          50% {
            box-shadow: 0 0 30px 10px rgba(250, 204, 21, 0.15);
          }
        }
      `}</style>

      <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-gray-950">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/5 rounded-full blur-[80px]" />
        </div>

        {/* Floating K letters */}
        {mounted && floatingKs.map((k, i) => (
          <FloatingK key={i} {...k} />
        ))}

        {/* Content */}
        <div
          className="relative z-10 max-w-xl w-full text-center"
          style={{ animation: mounted ? 'fadeInUp 0.8s ease-out' : 'none' }}
        >
          {/* Logo */}
          <div className="mb-8">
            <h1
              className="text-6xl font-bold text-white inline-block"
              style={{
                fontFamily: 'var(--font-raleway), sans-serif',
                animation: mounted ? 'pulseGlow 3s ease-in-out infinite' : 'none',
              }}
            >
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
                Kelo
              </span>
            </h1>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight tracking-tight">
            Build with your users,
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
              not assumptions.
            </span>
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-300 mb-3 leading-relaxed max-w-md mx-auto">
            Collect feedback, prioritize requests, and keep users updated on what your team is building.
          </p>
          <p className="text-sm text-gray-500 mb-10">
            Complete transparency between SaaS teams and their users.
          </p>

          {/* Waitlist form */}
          {status === 'success' ? (
            <div
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-6 backdrop-blur-sm"
              style={{ animation: 'fadeInUp 0.5s ease-out' }}
            >
              <p className="text-emerald-400 font-semibold text-lg">{message}</p>
              <p className="text-emerald-400/70 text-sm mt-1">We'll notify you as soon as Kelo goes live.</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-yellow-400/70 mb-4 font-semibold uppercase tracking-widest">
                Join the waitlist for early access
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-14 px-5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 placeholder:text-gray-500 backdrop-blur-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="h-14 px-8 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-gray-900 font-bold text-sm transition-all disabled:opacity-60 cursor-pointer whitespace-nowrap hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] active:scale-[0.98]"
                >
                  {status === 'loading' ? 'Joining...' : 'Notify me when Kelo goes live'}
                </button>
              </form>
            </div>
          )}

          {status === 'error' && (
            <p className="text-red-400 text-sm mt-3">{message}</p>
          )}
        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Kelo. All rights reserved.
        </footer>
      </main>
    </>
  )
}
