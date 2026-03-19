'use client'

import { useEffect } from 'react'
import Header from '@/components/homepage/Header'
import Hero from '@/components/homepage/Hero'
import Features from '@/components/homepage/Features'
import Changelog from '@/components/homepage/Changelog'
import Pricing from '@/components/homepage/Pricing'
import CTA from '@/components/homepage/CTA'
import Footer from '@/components/homepage/Footer'

export default function HomePage() {
  useEffect(() => {
    // Set cookie so /login, /signup, /pricing are accessible
    document.cookie = 'kelo_home=1;path=/;max-age=3600'
  }, [])

  return (
    <main className="min-h-screen bg-white dark:bg-[#080808] transition-colors duration-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />
      <Hero />
      <Features />
      <Changelog />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
