'use client';
import React from 'react';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="py-28 bg-kelo-surface dark:bg-[#0D0D0D] overflow-hidden transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 50%, #0D0D0D 100%)' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-56 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,197,24,0.18)' }} />
          <div className="absolute bottom-0 right-0 w-72 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,197,24,0.08)' }} />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(245,197,24,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.08) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              opacity: 0.6,
            }}
          />

          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            }}
          />

          <div className="relative z-10 p-12 md:p-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-kelo-mono font-semibold text-white/50 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow animate-pulse-slow inline-block" />
                Ship what users want
              </div>

              <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white leading-[1.08] tracking-tight mb-4">
                Stop guessing.
                <br />
                <span className="text-kelo-yellow">Start shipping.</span>
              </h2>

              <p className="text-base text-white/55 max-w-lg mx-auto mb-10 leading-relaxed">
                Collect feedback, prioritize features, and ship what users actually want. All in one place.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                <Link
                  href="/signup"
                  className="group flex items-center gap-2 px-7 py-3.5 bg-kelo-yellow text-kelo-ink font-semibold text-sm rounded-xl hover:bg-kelo-yellow-dark transition-all duration-200 shadow-[0_4px_24px_rgba(245,197,24,0.4)] hover:shadow-[0_6px_32px_rgba(245,197,24,0.55)]"
                >
                  Start free today
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="px-7 py-3.5 bg-white/8 text-white font-semibold text-sm rounded-xl border border-white/10 hover:bg-white/14 transition-all duration-200"
                >
                  Log in
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                {['7-day free trial', 'No credit card', 'Cancel anytime'].map((item, i) => (
                  <React.Fragment key={item}>
                    <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
                      <svg className="w-3 h-3 text-kelo-yellow/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </div>
                    {i < 2 && <span className="hidden sm:block w-px h-3 bg-white/10" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
