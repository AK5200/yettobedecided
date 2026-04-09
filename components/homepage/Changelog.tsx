'use client';
import React from 'react';

const entries = [
  {
    version: 'v2.4.0',
    date: 'March 2026',
    tag: '🚀 New',
    tagColor: 'bg-kelo-yellow-light dark:bg-kelo-yellow/10 text-kelo-yellow-dark dark:text-kelo-yellow border-kelo-yellow/30',
    title: 'Slack notifications',
    description: 'Get notified in Slack when users submit feedback or vote on features. Connect your workspace in under 60 seconds.',
    impact: 'High impact',
    impactCls: 'text-kelo-yellow-dark dark:text-kelo-yellow bg-kelo-yellow-light dark:bg-kelo-yellow/10',
  },
  {
    version: 'v2.3.0',
    date: 'February 2026',
    tag: '✓ Shipped',
    tagColor: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20',
    title: 'CSV export for all boards',
    description: 'Export your entire feedback board to CSV. Filter by status, votes, or date range before exporting.',
    impact: 'Requested by 98 users',
    impactCls: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
  },
  {
    version: 'v2.2.0',
    date: 'January 2026',
    tag: '⚡ Improved',
    tagColor: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    title: 'Custom domain support',
    description: 'Point your own domain to your Kelo feedback board. Full SSL included, zero config required.',
    impact: 'Pro feature',
    impactCls: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
  },
];

export default function Changelog() {
  return (
    <section id="changelog" className="py-28 bg-white dark:bg-[#080808] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
          <div className="lg:col-span-2 lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-kelo-border dark:border-white/10 bg-kelo-surface dark:bg-white/5 text-xs font-kelo-mono font-semibold text-kelo-muted dark:text-white/40 tracking-widest uppercase">
              What&apos;s new
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-kelo-ink dark:text-white leading-[1.08] tracking-tight mb-4">
              We ship fast.
              <br />
              <span className="text-kelo-muted dark:text-white/40 font-semibold text-3xl md:text-4xl">You&apos;ll notice.</span>
            </h2>
            <p className="text-base text-kelo-muted dark:text-white/50 leading-relaxed mb-8">
              Every feature in our changelog started as a user request. We eat our own dog food.
            </p>

            <div className="p-5 bg-kelo-yellow-light dark:bg-kelo-yellow/8 border border-kelo-yellow/30 rounded-2xl mb-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-kelo-yellow flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-4 h-4 text-kelo-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-kelo-ink dark:text-white leading-snug">Ship what users want, not what hype says.</div>
                  <div className="text-xs text-kelo-muted dark:text-white/50 mt-1">— The Kelo philosophy</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '100%', label: 'Transparent roadmap' },
                { value: '0', label: 'Hidden agendas' },
              ].map((s) => (
                <div key={s.label} className="p-4 bg-kelo-surface dark:bg-white/5 border border-kelo-border dark:border-white/10 rounded-xl">
                  <div className="text-2xl font-display font-extrabold text-kelo-ink dark:text-white mb-0.5">{s.value}</div>
                  <div className="text-xs text-kelo-muted dark:text-white/40 font-medium leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            {entries.map((entry) => (
              <ChangelogEntry key={entry.version} entry={entry} />
            ))}
            <a
              href="#"
              className="flex items-center gap-2 text-sm font-semibold text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors group mt-2"
            >
              View full changelog
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ChangelogEntryData {
  version: string;
  date: string;
  tag: string;
  tagColor: string;
  title: string;
  description: string;
  impact: string;
  impactCls: string;
}

function ChangelogEntry({ entry }: { entry: ChangelogEntryData }) {
  return (
    <div className="group p-5 bg-white dark:bg-[#111111] border border-kelo-border dark:border-white/10 rounded-2xl hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-kelo-border-dark dark:hover:border-white/20 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-kelo-mono text-xs font-bold text-kelo-ink dark:text-white bg-kelo-surface dark:bg-white/8 px-2 py-1 rounded-md border border-kelo-border dark:border-white/10">
            {entry.version}
          </span>
          <span className="text-xs text-kelo-muted dark:text-white/40">{entry.date}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entry.impactCls}`}>
            {entry.impact}
          </span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${entry.tagColor}`}>
          {entry.tag}
        </span>
      </div>
      <h3 className="text-base font-bold text-kelo-ink dark:text-white mb-1.5 group-hover:text-kelo-yellow-dark transition-colors">{entry.title}</h3>
      <p className="text-sm text-kelo-muted dark:text-white/50 leading-relaxed">{entry.description}</p>
    </div>
  );
}
