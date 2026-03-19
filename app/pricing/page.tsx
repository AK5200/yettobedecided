'use client'

import { useEffect } from 'react'
import Header from '@/components/homepage/Header'
import Pricing from '@/components/homepage/Pricing'
import CTA from '@/components/homepage/CTA'
import Footer from '@/components/homepage/Footer'

export default function PricingPage() {
  useEffect(() => {
    document.cookie = 'kelo_home=1;path=/;max-age=3600'
  }, [])

  return (
    <main className="min-h-screen bg-white dark:bg-[#080808] transition-colors duration-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />
      <div className="pt-24" />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
