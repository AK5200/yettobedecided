'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function WaitlistPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [scrolled, setScrolled] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const belowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setStatus('idle');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  const scrollToDetails = () => {
    belowRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white dark:bg-[#080808] transition-colors duration-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero section */}
      <div ref={sectionRef} className="relative min-h-screen flex flex-col overflow-hidden">
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
        <div className="absolute top-40 left-[10%] w-72 h-72 rounded-full bg-kelo-yellow/[0.06] blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute top-56 right-[8%] w-56 h-56 rounded-full bg-kelo-yellow/[0.08] blur-2xl animate-float pointer-events-none" />
        <div className="absolute bottom-32 left-[35%] w-40 h-40 rounded-full bg-kelo-yellow/[0.05] blur-2xl pointer-events-none" />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 md:px-10 pt-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-kelo-yellow flex items-center justify-center shadow-sm group-hover:shadow-[0_0_12px_rgba(245,197,24,0.5)] transition-shadow duration-200">
              <span className="text-kelo-ink font-display font-extrabold text-sm leading-none">K</span>
            </div>
            <span className="font-display font-bold text-kelo-ink dark:text-white text-lg tracking-tight">Kelo</span>
          </Link>

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
        </header>

        {/* Main hero content */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20">
          <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full border border-kelo-yellow/35 bg-kelo-yellow-light dark:bg-kelo-yellow/10 text-xs font-kelo-mono font-semibold text-kelo-yellow-dark tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow animate-pulse-slow inline-block" />
              Coming Soon
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display font-extrabold text-kelo-ink dark:text-white leading-[1.06] tracking-tight mb-5">
              Build better products
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">with your users</span>
                <span
                  className="absolute inset-x-0 bottom-1.5 h-3 -z-0 rounded-sm"
                  style={{ background: 'rgba(245,197,24,0.38)' }}
                />
              </span>
            </h1>

            <p className="text-base md:text-lg text-kelo-muted dark:text-white/50 leading-relaxed mb-4 max-w-sm">
              Kelo is launching soon. Join the waitlist to get early access and shape the product from day one.
            </p>
            <p className="text-sm text-kelo-muted dark:text-white/40 leading-relaxed mb-10 max-w-xs">
              One place to collect feedback, share your roadmap, and celebrate every ship — built for founders who actually listen to their users.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
                    isDark
                      ? 'bg-white/[0.06] border-white/10 text-white placeholder-white/30 focus:border-kelo-yellow/50 focus:bg-white/[0.08]'
                      : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/60 focus:border-kelo-yellow/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,197,24,0.12)]'
                  }`}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-6 py-3 rounded-xl text-sm font-semibold bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark transition-all duration-200 shadow-sm hover:shadow-[0_0_20px_rgba(245,197,24,0.4)] whitespace-nowrap disabled:opacity-60"
                >
                  {status === 'loading' ? 'Joining...' : 'Join waitlist'}
                </button>
              </form>
            ) : (
              <div className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border ${
                isDark ? 'bg-kelo-yellow/10 border-kelo-yellow/25' : 'bg-kelo-yellow-light border-kelo-yellow/30'
              }`}>
                <div className="w-8 h-8 rounded-full bg-kelo-yellow flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-kelo-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-kelo-ink dark:text-white">You&apos;re on the list!</p>
                  <p className="text-xs text-kelo-muted dark:text-white/50 mt-0.5">We&apos;ll reach out when early access opens.</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <p className="text-red-400 text-sm mt-3">{errorMsg}</p>
            )}

            <div className="mt-8 flex items-center gap-2">
              <p className="text-xs text-kelo-muted dark:text-white/40 font-medium">
                Be among the <span className="text-kelo-ink dark:text-white font-semibold">first founders</span> to try Kelo
              </p>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-2.5 max-w-xl mx-auto">
            {[
              { icon: '💬', label: 'Feedback boards' },
              { icon: '🗺️', label: 'Public roadmap' },
              { icon: '📣', label: 'Changelog' },
              { icon: '⚡', label: 'Instant setup' },
            ].map((pill) => (
              <div
                key={pill.label}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-white/60'
                    : 'bg-kelo-surface border-kelo-border text-kelo-muted'
                }`}
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
              </div>
            ))}
          </div>
        </main>

        <div className="relative z-10 flex justify-center pb-10">
          <button
            onClick={scrollToDetails}
            aria-label="Scroll to product details"
            className={`flex flex-col items-center gap-1.5 group transition-opacity duration-500 ${scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <span className="text-xs font-medium text-kelo-muted dark:text-white/30 group-hover:text-kelo-ink dark:group-hover:text-white/60 transition-colors">
              See what&apos;s inside
            </span>
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 group-hover:border-kelo-yellow/50 group-hover:bg-kelo-yellow/10 ${
              isDark ? 'border-white/10 bg-white/5' : 'border-kelo-border bg-kelo-surface'
            }`}>
              <svg
                className="w-4 h-4 text-kelo-muted dark:text-white/40 group-hover:text-kelo-yellow transition-colors animate-bounce"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Below-fold product details */}
      <div ref={belowRef}>
        <WaitlistFeatures />
        <WaitlistChangelog />
        <WaitlistCTA submitted={submitted} email={email} setEmail={setEmail} setSubmitted={setSubmitted} isDark={isDark} handleApiSubmit={handleSubmit} status={status} />
      </div>

      <footer className="flex items-center justify-center py-8 px-6 bg-white dark:bg-[#080808]">
        <p className="text-xs text-kelo-muted dark:text-white/30">
          © {new Date().getFullYear()} Kelo. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
function WaitlistFeatures() {
  return (
    <section className="py-28 bg-white dark:bg-[#080808] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-kelo-border dark:border-white/10 bg-kelo-surface dark:bg-white/5 text-xs font-kelo-mono font-semibold text-kelo-muted dark:text-white/40 tracking-widest uppercase">
            Everything you need
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-kelo-ink dark:text-white leading-[1.08] tracking-tight mb-4">
            Three tools.
            <br />
            <span className="text-kelo-muted dark:text-white/40 font-semibold text-3xl md:text-4xl">One workflow.</span>
          </h2>
          <p className="text-lg text-kelo-muted dark:text-white/50 leading-relaxed">
            Collect → Prioritize → Ship → Celebrate. Built for teams who move fast.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 group relative rounded-2xl border border-kelo-border dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col">
            <div className="p-8 pb-6">
              <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full text-xs font-kelo-mono font-semibold border border-kelo-yellow/30 bg-kelo-yellow-light dark:bg-kelo-yellow/10 text-kelo-yellow-dark">
                <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow" />
                01 — Feedback Boards
              </div>
              <h3 className="text-2xl font-display font-bold text-kelo-ink dark:text-white mb-3 leading-tight">One place for every user request</h3>
              <p className="text-kelo-muted dark:text-white/50 leading-relaxed mb-6 max-w-sm">
                Give users a public or private board to submit ideas, vote on features, and comment. No more digging through emails or Slack threads.
              </p>
              <ul className="grid grid-cols-2 gap-2">
                {['Public & private boards', 'Upvoting & commenting', 'Merge duplicate requests', 'Custom categories & tags'].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm">
                    <svg className="w-3.5 h-3.5 text-kelo-yellow shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    <span className="font-medium text-kelo-ink dark:text-white/80">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden bg-kelo-surface dark:bg-[#0A0A0A] border-t border-kelo-border dark:border-white/8 flex-1 min-h-52 flex items-end justify-center p-6 pt-8">
              <FeedbackVisual />
            </div>
          </div>

          <div className="md:col-span-5 group relative rounded-2xl border border-kelo-border dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col">
            <div className="p-8 pb-6">
              <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full text-xs font-kelo-mono font-semibold border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                02 — Public Roadmap
              </div>
              <h3 className="text-xl font-display font-bold text-kelo-ink dark:text-white mb-3 leading-tight">Show users what&apos;s coming</h3>
              <p className="text-kelo-muted dark:text-white/50 leading-relaxed text-sm mb-5">A shareable roadmap that keeps your community in the loop. Move cards from Planned to Shipped.</p>
              <ul className="flex flex-col gap-2">
                {['Drag-and-drop kanban', 'Public shareable URL', 'Status updates notify voters'].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm">
                    <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    <span className="font-medium text-kelo-ink dark:text-white/80">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden bg-kelo-surface dark:bg-[#0A0A0A] border-t border-kelo-border dark:border-white/8 flex-1 min-h-44 flex items-center justify-center p-5">
              <RoadmapVisual />
            </div>
          </div>

          <div className="md:col-span-5 group relative rounded-2xl border border-kelo-border dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col">
            <div className="p-8 pb-6">
              <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full text-xs font-kelo-mono font-semibold border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-kelo-green" />
                03 — Changelog
              </div>
              <h3 className="text-xl font-display font-bold text-kelo-ink dark:text-white mb-3 leading-tight">Celebrate every ship</h3>
              <p className="text-kelo-muted dark:text-white/50 leading-relaxed text-sm mb-5">Auto-notify users when their requested feature ships. Turn every release into a moment of delight.</p>
              <ul className="flex flex-col gap-2">
                {['Auto-notify voters on ship', 'Embeddable changelog widget', 'RSS feed included'].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm">
                    <svg className="w-3.5 h-3.5 text-kelo-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    <span className="font-medium text-kelo-ink dark:text-white/80">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden bg-kelo-surface dark:bg-[#0A0A0A] border-t border-kelo-border dark:border-white/8 flex-1 min-h-44 flex items-center justify-center p-5">
              <ChangelogVisual />
            </div>
          </div>

          <div className="md:col-span-7 group relative rounded-2xl border border-white/8 overflow-hidden hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #141414 100%)' }}>
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(245,197,24,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.12) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,197,24,0.15)' }} />
            <div className="relative z-10 p-8">
              <div className="inline-flex items-center gap-1.5 mb-6 px-2.5 py-1 rounded-full text-xs font-kelo-mono font-semibold border border-white/10 bg-white/5 text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow animate-pulse-slow" />
                Built for speed
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2 leading-tight">
                From feedback to shipped<br /><span className="text-kelo-yellow">in record time.</span>
              </h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-sm">The average Kelo team ships 2× more user-requested features per quarter than teams using spreadsheets.</p>
              <div className="grid grid-cols-3 gap-4">
                {[{ value: '2×', label: 'More features shipped' }, { value: '400+', label: 'Product teams' }, { value: '2 min', label: 'Setup time' }].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-xl border border-white/8 bg-white/5">
                    <div className="text-2xl font-display font-extrabold text-kelo-yellow mb-1">{stat.value}</div>
                    <div className="text-xs text-white/50 font-medium leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeedbackVisual() {
  const items = [
    { title: 'Dark mode support', votes: 142, tag: 'UI', tagCls: 'bg-kelo-yellow/15 text-kelo-yellow-dark dark:text-kelo-yellow border-kelo-yellow/20', hot: true },
    { title: 'CSV export', votes: 98, tag: 'Export', tagCls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20', hot: false },
    { title: 'Slack integration', votes: 76, tag: 'Integrations', tagCls: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20', hot: false },
  ];
  return (
    <div className="w-full max-w-sm flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-xl border border-kelo-border dark:border-white/8 shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:border-kelo-border-dark dark:hover:border-white/15 transition-all">
          <div className="flex flex-col items-center min-w-[32px] gap-0.5">
            <svg className="w-3 h-3 text-kelo-yellow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l8 8H4z" /></svg>
            <span className="text-xs font-bold text-kelo-ink dark:text-white">{item.votes}</span>
          </div>
          <span className="flex-1 text-sm font-medium text-kelo-ink dark:text-white/80">{item.title}</span>
          {item.hot && <span className="text-xs font-bold text-orange-500">🔥</span>}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${item.tagCls}`}>{item.tag}</span>
        </div>
      ))}
    </div>
  );
}

function RoadmapVisual() {
  const cols = [
    { label: 'Planned', cls: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400', items: ['Dark mode', 'CSV export'] },
    { label: 'In Progress', cls: 'bg-kelo-yellow-light dark:bg-kelo-yellow/10 border-kelo-yellow/30 text-kelo-yellow-dark dark:text-kelo-yellow', items: ['Slack notifs'] },
    { label: 'Shipped', cls: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400', items: ['Voting', 'Comments'] },
  ];
  return (
    <div className="w-full flex gap-2">
      {cols.map((col) => (
        <div key={col.label} className="flex-1 flex flex-col gap-2">
          <div className={`text-xs font-bold px-2 py-1.5 rounded-lg border text-center ${col.cls}`}>{col.label}</div>
          {col.items.map((item) => (
            <div key={item} className="bg-white dark:bg-white/5 border border-kelo-border dark:border-white/8 rounded-lg px-2 py-2 text-xs font-medium text-kelo-ink dark:text-white/70 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">{item}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ChangelogVisual() {
  const entries = [
    { version: 'v2.4', date: 'Mar 2026', title: 'Slack notifications shipped', badge: '🚀 New', badgeCls: 'bg-kelo-yellow-light dark:bg-kelo-yellow/10 text-kelo-yellow-dark dark:text-kelo-yellow border-kelo-yellow/25' },
    { version: 'v2.3', date: 'Feb 2026', title: 'CSV export is live', badge: '✓ Shipped', badgeCls: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20' },
  ];
  return (
    <div className="w-full flex flex-col gap-2.5">
      {entries.map((e) => (
        <div key={e.version} className="flex items-start gap-3 p-3 bg-white dark:bg-white/5 rounded-xl border border-kelo-border dark:border-white/8 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col items-center gap-0.5 min-w-[40px]">
            <span className="text-xs font-kelo-mono font-bold text-kelo-ink dark:text-white">{e.version}</span>
            <span className="text-xs text-kelo-muted dark:text-white/40">{e.date}</span>
          </div>
          <div className="flex-1"><div className="text-sm font-medium text-kelo-ink dark:text-white/80">{e.title}</div></div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${e.badgeCls}`}>{e.badge}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Changelog Section ────────────────────────────────────────────────────────
const changelogEntries = [
  { version: 'v2.4.0', date: 'March 2026', tag: '🚀 New', tagColor: 'bg-kelo-yellow-light dark:bg-kelo-yellow/10 text-kelo-yellow-dark dark:text-kelo-yellow border-kelo-yellow/30', title: 'Slack notifications', description: 'Get notified in Slack when users submit feedback or vote on features. Connect your workspace in under 60 seconds.', impact: 'High impact', impactCls: 'text-kelo-yellow-dark dark:text-kelo-yellow bg-kelo-yellow-light dark:bg-kelo-yellow/10' },
  { version: 'v2.3.0', date: 'February 2026', tag: '✓ Shipped', tagColor: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20', title: 'CSV export for all boards', description: 'Export your entire feedback board to CSV. Filter by status, votes, or date range before exporting.', impact: 'Requested by 98 users', impactCls: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10' },
  { version: 'v2.2.0', date: 'January 2026', tag: '⚡ Improved', tagColor: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20', title: 'Custom domain support', description: 'Point your own domain to your Kelo feedback board. Full SSL included, zero config required.', impact: 'Pro feature', impactCls: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' },
];

function WaitlistChangelog() {
  return (
    <section className="py-28 bg-white dark:bg-[#080808] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
          <div className="lg:col-span-2 lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-kelo-border dark:border-white/10 bg-kelo-surface dark:bg-white/5 text-xs font-kelo-mono font-semibold text-kelo-muted dark:text-white/40 tracking-widest uppercase">
              What&apos;s new
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-kelo-ink dark:text-white leading-[1.08] tracking-tight mb-4">
              We ship fast.<br /><span className="text-kelo-muted dark:text-white/40 font-semibold text-3xl md:text-4xl">You&apos;ll notice.</span>
            </h2>
            <p className="text-base text-kelo-muted dark:text-white/50 leading-relaxed mb-8">Every feature in our changelog started as a user request. We eat our own dog food.</p>
            <div className="p-5 bg-kelo-yellow-light dark:bg-kelo-yellow/8 border border-kelo-yellow/30 rounded-2xl mb-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-kelo-yellow flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-4 h-4 text-kelo-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-kelo-ink dark:text-white leading-snug">Ship what users want, not what hype says.</div>
                  <div className="text-xs text-kelo-muted dark:text-white/50 mt-1">— The Kelo philosophy</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[{ value: '12', label: 'Releases this year' }, { value: '94%', label: 'User-requested features' }].map((s) => (
                <div key={s.label} className="p-4 bg-kelo-surface dark:bg-white/5 border border-kelo-border dark:border-white/10 rounded-xl">
                  <div className="text-2xl font-display font-extrabold text-kelo-ink dark:text-white mb-0.5">{s.value}</div>
                  <div className="text-xs text-kelo-muted dark:text-white/40 font-medium leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 flex flex-col gap-4">
            {changelogEntries.map((entry) => (
              <div key={entry.version} className="group p-5 bg-white dark:bg-[#111111] border border-kelo-border dark:border-white/10 rounded-2xl hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-kelo-border-dark dark:hover:border-white/20 transition-all duration-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-kelo-mono text-xs font-bold text-kelo-ink dark:text-white bg-kelo-surface dark:bg-white/8 px-2 py-1 rounded-md border border-kelo-border dark:border-white/10">{entry.version}</span>
                    <span className="text-xs text-kelo-muted dark:text-white/40">{entry.date}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entry.impactCls}`}>{entry.impact}</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${entry.tagColor}`}>{entry.tag}</span>
                </div>
                <h3 className="text-base font-bold text-kelo-ink dark:text-white mb-1.5 group-hover:text-kelo-yellow-dark transition-colors">{entry.title}</h3>
                <p className="text-sm text-kelo-muted dark:text-white/50 leading-relaxed">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────
interface WaitlistCTAProps {
  submitted: boolean;
  email: string;
  setEmail: (v: string) => void;
  setSubmitted: (v: boolean) => void;
  isDark: boolean;
  handleApiSubmit: (e: React.FormEvent) => void;
  status: string;
}

function WaitlistCTA({ submitted, email, setEmail, isDark, handleApiSubmit, status }: WaitlistCTAProps) {
  return (
    <section className="py-28 bg-kelo-surface dark:bg-[#0D0D0D] overflow-hidden transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 50%, #0D0D0D 100%)' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-56 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,197,24,0.18)' }} />
          <div className="absolute bottom-0 right-0 w-72 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,197,24,0.08)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(245,197,24,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.08) 1px, transparent 1px)', backgroundSize: '44px 44px', opacity: 0.6 }} />
          <div className="relative z-10 p-12 md:p-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-kelo-mono font-semibold text-white/40 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow animate-pulse-slow inline-block" />
                Early access
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white leading-[1.08] tracking-tight mb-4">
                Be first in line.<br /><span className="text-kelo-yellow">Shape the product.</span>
              </h2>
              <p className="text-base text-white/55 max-w-lg mx-auto mb-10 leading-relaxed">
                Early access members get priority onboarding, locked-in launch pricing, and a direct line to the team. Don&apos;t miss the first wave.
              </p>

              {!submitted ? (
                <form onSubmit={handleApiSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-all duration-200 bg-white/[0.06] border-white/10 text-white placeholder-white/30 focus:border-kelo-yellow/50 focus:bg-white/[0.08]"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-6 py-3 rounded-xl text-sm font-semibold bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark transition-all duration-200 shadow-[0_4px_24px_rgba(245,197,24,0.4)] hover:shadow-[0_6px_32px_rgba(245,197,24,0.55)] whitespace-nowrap disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Joining...' : 'Join waitlist'}
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl border bg-kelo-yellow/10 border-kelo-yellow/25 max-w-md mx-auto mb-8">
                  <div className="w-8 h-8 rounded-full bg-kelo-yellow flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-kelo-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">You&apos;re on the list!</p>
                    <p className="text-xs text-white/50 mt-0.5">We&apos;ll reach out when early access opens.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                {['Free forever plan', 'No credit card', 'Cancel anytime'].map((item, i) => (
                  <React.Fragment key={item}>
                    <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
                      <svg className="w-3 h-3 text-kelo-yellow/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
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
