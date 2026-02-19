'use client'

import { useEffect, useRef, useCallback } from 'react'
import { CheckCircle2 } from 'lucide-react'

const COLORS = ['#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#6366f1']
const PARTICLE_COUNT = 120
const GRAVITY = 0.12
const DRAG = 0.98

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  shape: 'rect' | 'circle'
  opacity: number
}

export function Celebration({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)

  const createParticles = useCallback((width: number, height: number) => {
    const result: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.random() * Math.PI * 2)
      const velocity = 4 + Math.random() * 8
      result.push({
        x: width / 2 + (Math.random() - 0.5) * width * 0.3,
        y: height * 0.45,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 6,
        size: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        opacity: 1,
      })
    }
    return result
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    particles.current = createParticles(canvas.width, canvas.height)

    let frame = 0
    const animate = () => {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let alive = 0
      for (const p of particles.current) {
        p.vy += GRAVITY
        p.vx *= DRAG
        p.vy *= DRAG
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed

        // Fade out after 60 frames
        if (frame > 60) {
          p.opacity = Math.max(0, p.opacity - 0.012)
        }

        if (p.opacity <= 0) continue
        alive++

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.opacity

        ctx.fillStyle = p.color
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }

      if (alive > 0 && frame < 200) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    // Redirect after 1.5 seconds
    const timer = setTimeout(onComplete, 1500)

    return () => {
      cancelAnimationFrame(animationRef.current)
      clearTimeout(timer)
      window.removeEventListener('resize', resize)
    }
  }, [createParticles, onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Center message */}
      <div className="relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">You&apos;re all set!</h2>
        <p className="text-sm text-gray-400 mt-2">Taking you to your dashboard...</p>
      </div>
    </div>
  )
}
