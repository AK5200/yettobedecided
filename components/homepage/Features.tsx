'use client';
import React from 'react';

export default function Features() {
  return (
    <section id="features" className="py-28 bg-white dark:bg-[#080808] transition-colors duration-300">
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
          {/* Card 1 — Feedback Boards */}
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
                    <svg className="w-3.5 h-3.5 text-kelo-yellow shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="font-medium text-kelo-ink dark:text-white/80">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden bg-kelo-surface dark:bg-[#0A0A0A] border-t border-kelo-border dark:border-white/8 flex-1 min-h-52 flex items-end justify-center p-6 pt-8">
              <FeedbackVisual />
            </div>
          </div>

          {/* Card 2 — Public Roadmap */}
          <div className="md:col-span-5 group relative rounded-2xl border border-kelo-border dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col">
            <div className="p-8 pb-6">
              <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full text-xs font-kelo-mono font-semibold border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                02 — Public Roadmap
              </div>
              <h3 className="text-xl font-display font-bold text-kelo-ink dark:text-white mb-3 leading-tight">Show users what&apos;s coming</h3>
              <p className="text-kelo-muted dark:text-white/50 leading-relaxed text-sm mb-5">
                A shareable roadmap that keeps your community in the loop. Move cards from Planned to Shipped.
              </p>
              <ul className="flex flex-col gap-2">
                {['Drag-and-drop kanban', 'Public shareable URL', 'Status updates notify voters'].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm">
                    <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="font-medium text-kelo-ink dark:text-white/80">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden bg-kelo-surface dark:bg-[#0A0A0A] border-t border-kelo-border dark:border-white/8 flex-1 min-h-44 flex items-center justify-center p-5">
              <RoadmapVisual />
            </div>
          </div>

          {/* Card 3 — Changelog */}
          <div className="md:col-span-5 group relative rounded-2xl border border-kelo-border dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col">
            <div className="p-8 pb-6">
              <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full text-xs font-kelo-mono font-semibold border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-kelo-green" />
                03 — Changelog
              </div>
              <h3 className="text-xl font-display font-bold text-kelo-ink dark:text-white mb-3 leading-tight">Celebrate every ship</h3>
              <p className="text-kelo-muted dark:text-white/50 leading-relaxed text-sm mb-5">
                Auto-notify users when their requested feature ships. Turn every release into a moment of delight.
              </p>
              <ul className="flex flex-col gap-2">
                {['Auto-notify voters on ship', 'Embeddable changelog widget', 'RSS feed included'].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm">
                    <svg className="w-3.5 h-3.5 text-kelo-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="font-medium text-kelo-ink dark:text-white/80">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden bg-kelo-surface dark:bg-[#0A0A0A] border-t border-kelo-border dark:border-white/8 flex-1 min-h-44 flex items-center justify-center p-5">
              <ChangelogVisual />
            </div>
          </div>

          {/* Card 4 — Stats */}
          <div className="md:col-span-7 group relative rounded-2xl border border-white/8 overflow-hidden hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #141414 100%)' }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: 'linear-gradient(rgba(245,197,24,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.12) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,197,24,0.15)' }} />

            <div className="relative z-10 p-8">
              <div className="inline-flex items-center gap-1.5 mb-6 px-2.5 py-1 rounded-full text-xs font-kelo-mono font-semibold border border-white/10 bg-white/5 text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow animate-pulse-slow" />
                Built for speed
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2 leading-tight">
                From feedback to shipped
                <br />
                <span className="text-kelo-yellow">in record time.</span>
              </h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-sm">
                The average Kelo team ships 2× more user-requested features per quarter than teams using spreadsheets.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '2×', label: 'More features shipped' },
                  { value: '400+', label: 'Product teams' },
                  { value: '2 min', label: 'Setup time' },
                ].map((stat) => (
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
        <div key={item.title} className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-xl border border-kelo-border dark:border-white/8 shadow-[0_1px_4px_rgba(0,0,0,0.05)] group/card hover:border-kelo-border-dark dark:hover:border-white/15 transition-all">
          <div className="flex flex-col items-center min-w-[32px] gap-0.5">
            <svg className="w-3 h-3 text-kelo-yellow" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4l8 8H4z" />
            </svg>
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
          <div className="flex-1">
            <div className="text-sm font-medium text-kelo-ink dark:text-white/80">{e.title}</div>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${e.badgeCls}`}>{e.badge}</span>
        </div>
      ))}
    </div>
  );
}
