'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-[#080808] pt-28 pb-16 transition-colors duration-300"
    >
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 60% 50% at ${mousePos.x}% ${mousePos.y}%, rgba(245,197,24,0.10) 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 50% at 50% -5%, rgba(245,197,24,0.14) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(245,197,24,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.06) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(ellipse 85% 55% at 50% 0%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 55% at 50% 0%, black 20%, transparent 75%)',
        }}
      />

      <div className="absolute top-40 left-[15%] w-72 h-72 rounded-full bg-kelo-yellow/6 blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute top-56 right-[12%] w-56 h-56 rounded-full bg-kelo-yellow/8 blur-2xl animate-float pointer-events-none" />
      <div className="absolute bottom-32 left-[30%] w-40 h-40 rounded-full bg-kelo-yellow/5 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full border border-kelo-yellow/35 bg-kelo-yellow-light dark:bg-kelo-yellow/10 text-xs font-kelo-mono font-semibold text-kelo-yellow-dark tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow animate-pulse-slow inline-block" />
          Feedback · Roadmap · Changelog
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-display font-extrabold text-kelo-ink dark:text-white leading-[1.04] tracking-tight mb-5">
          The feedback tool
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">serious founders</span>
            <span
              className="absolute inset-x-0 bottom-1.5 h-3.5 -z-0 rounded-sm"
              style={{ background: 'rgba(245,197,24,0.38)' }}
            />
          </span>{' '}
          use
        </h1>

        <p className="text-lg md:text-xl text-kelo-muted dark:text-white/50 max-w-xl leading-relaxed mb-4 font-medium">
          Collect, organize, and act on user feedback.{' '}
          <span className="text-kelo-ink dark:text-white font-semibold">No spreadsheets. No Slack chaos. No per-seat pricing.</span>
        </p>

        <div className="flex items-center gap-2 mb-10">
          <div className="flex -space-x-2">
            {['#F5C518', '#0A0A0A', '#6B7280', '#22C55E'].map((color, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-[#080808] flex items-center justify-center text-xs font-bold"
                style={{ background: color, color: i === 0 || i === 2 ? '#0A0A0A' : '#fff', zIndex: 4 - i }}
              >
                {['A', 'M', 'S', 'J'][i]}
              </div>
            ))}
          </div>
          <span className="text-sm text-kelo-muted dark:text-white/50 font-medium">
            Trusted by <span className="text-kelo-ink dark:text-white font-semibold">400+ product teams</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-14">
          <Link
            href="/signup"
            className="group flex items-center gap-2 px-7 py-3.5 bg-kelo-yellow text-kelo-ink font-semibold text-sm rounded-xl hover:bg-kelo-yellow-dark transition-all duration-200 shadow-[0_2px_12px_rgba(245,197,24,0.35)] hover:shadow-[0_4px_24px_rgba(245,197,24,0.5)]"
          >
            Start free — no card needed
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 px-7 py-3.5 bg-white dark:bg-white/[0.08] text-kelo-ink dark:text-white font-semibold text-sm rounded-xl border border-kelo-border dark:border-white/10 hover:border-kelo-border-dark dark:hover:border-white/20 hover:bg-kelo-surface dark:hover:bg-white/[0.12] transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            <svg className="w-4 h-4 text-kelo-muted dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            See how it works
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm text-kelo-muted dark:text-white/40">
          <TrustItem text="Free forever plan" />
          <span className="hidden sm:block w-px h-4 bg-kelo-border dark:bg-white/10" />
          <TrustItem text="No per-seat pricing" />
          <span className="hidden sm:block w-px h-4 bg-kelo-border dark:bg-white/10" />
          <TrustItem text="Setup in 2 minutes" />
        </div>
      </div>

      <div className="relative z-10 mt-16 w-full max-w-5xl mx-auto px-6">
        <DashboardPreview />
      </div>
    </section>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5 text-kelo-yellow shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
      <span className="font-medium">{text}</span>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl blur-2xl bg-kelo-yellow/8 pointer-events-none" />
      <div
        className="relative rounded-2xl border border-kelo-border dark:border-white/10 overflow-hidden shadow-[0_8px_64px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_64px_rgba(0,0,0,0.5)] bg-white dark:bg-[#111111]"
      >
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-kelo-border dark:border-white/8 bg-white dark:bg-[#111111]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 bg-kelo-surface dark:bg-white/5 rounded-md text-xs font-kelo-mono text-kelo-muted dark:text-white/40 border border-kelo-border dark:border-white/8">
              app.kelohq.com/board
            </div>
          </div>
          <div className="w-16" />
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 min-h-72 bg-white dark:bg-[#0F0F0F]">
          <div className="hidden md:flex flex-col gap-1 border-r border-kelo-border dark:border-white/8 pr-4">
            <div className="text-xs font-semibold text-kelo-muted dark:text-white/30 uppercase tracking-wider mb-2 px-2">Boards</div>
            {[
              { label: 'Feature Requests', count: 47, active: true },
              { label: 'Bug Reports', count: 12, active: false },
              { label: 'Roadmap', count: null, active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  item.active
                    ? 'bg-kelo-yellow/12 text-kelo-ink dark:text-white border border-kelo-yellow/25'
                    : 'text-kelo-muted dark:text-white/50 hover:bg-kelo-surface dark:hover:bg-white/5'
                }`}
              >
                <span>{item.label}</span>
                {item.count && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${item.active ? 'bg-kelo-yellow/20 text-kelo-yellow-dark' : 'bg-kelo-surface dark:bg-white/10 text-kelo-muted dark:text-white/60'}`}>
                    {item.count}
                  </span>
                )}
              </div>
            ))}
            <div className="mt-auto pt-4 border-t border-kelo-border dark:border-white/8">
              <div className="px-2.5 py-2 rounded-lg text-xs font-medium text-kelo-muted dark:text-white/50 hover:bg-kelo-surface dark:hover:bg-white/5 cursor-pointer">Settings</div>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-kelo-ink dark:text-white">Feature Requests</div>
                <div className="text-xs text-kelo-muted dark:text-white/40 mt-0.5">47 items · sorted by votes</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1.5 bg-kelo-surface dark:bg-white/5 border border-kelo-border dark:border-white/8 rounded-lg text-xs font-medium text-kelo-muted dark:text-white/40">Filter</div>
                <div className="px-2.5 py-1.5 bg-kelo-yellow text-kelo-ink text-xs font-bold rounded-lg cursor-pointer">+ New</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { title: 'Dark mode support', votes: 142, status: 'planned', tag: 'UI', hot: true },
                { title: 'CSV export for all boards', votes: 98, status: 'in-progress', tag: 'Export', hot: false },
                { title: 'Slack notifications', votes: 76, status: 'in-progress', tag: 'Integrations', hot: false },
                { title: 'Custom domain for feedback board', votes: 54, status: 'planned', tag: 'Settings', hot: false },
              ].map((item) => (
                <FeedbackCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackCard({ title, votes, status, tag, hot }: { title: string; votes: number; status: string; tag: string; hot: boolean }) {
  const statusConfig: Record<string, { label: string; cls: string }> = {
    'planned': { label: 'Planned', cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' },
    'in-progress': { label: 'In Progress', cls: 'bg-kelo-yellow-light dark:bg-kelo-yellow/10 text-kelo-yellow-dark dark:text-kelo-yellow border-kelo-yellow/25' },
    'under-review': { label: 'Under Review', cls: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20' },
  };
  const s = statusConfig[status] || statusConfig['planned'];
  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1A1A1A] rounded-xl border border-kelo-border dark:border-white/10 hover:border-kelo-border-dark dark:hover:border-white/20 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all duration-150 cursor-pointer group">
      <div className="flex flex-col items-center gap-0.5 min-w-[36px] py-0.5">
        <svg className="w-3 h-3 text-kelo-muted dark:text-white/30 group-hover:text-kelo-yellow transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
        <span className="text-xs font-bold text-kelo-ink dark:text-white">{votes}</span>
      </div>
      <span className="flex-1 text-sm font-medium text-kelo-ink dark:text-white/80">{title}</span>
      {hot && <span className="text-xs font-bold text-orange-500">🔥</span>}
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${s.cls}`}>{tag}</span>
    </div>
  );
}
