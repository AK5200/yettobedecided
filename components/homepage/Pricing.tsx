'use client';
import React, { useState } from 'react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For indie hackers and early-stage products.',
    cta: 'Start free',
    highlight: false,
    features: [
      '1 feedback board',
      'Up to 100 feedback items',
      'Public roadmap',
      'Basic changelog',
      'Community support',
    ],
    notIncluded: ['Custom domain', 'Unlimited boards', 'Priority support', 'Analytics'],
  },
  {
    name: 'Starter',
    price: '$19',
    period: '/month',
    description: 'For growing products with real user bases.',
    cta: 'Get Starter',
    highlight: false,
    features: [
      '3 feedback boards',
      'Unlimited feedback items',
      'Public roadmap',
      'Full changelog',
      'Email notifications',
      'Custom branding',
    ],
    notIncluded: ['Custom domain', 'Priority support', 'Analytics'],
  },
  {
    name: 'Pro',
    price: '$39',
    period: '/month',
    description: 'For product teams who ship fast and often.',
    cta: 'Get Pro',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Unlimited boards',
      'Unlimited feedback items',
      'Custom domain',
      'Advanced analytics',
      'Slack & email notifications',
      'Priority support',
      'API access',
    ],
    notIncluded: [],
  },
  {
    name: 'Business',
    price: '$99',
    period: '/month',
    description: 'For scaling teams with enterprise needs.',
    cta: 'Get Business',
    highlight: false,
    features: [
      'Everything in Pro',
      'SSO / SAML',
      'Dedicated success manager',
      'SLA guarantee',
      'Custom integrations',
      'Audit logs',
      'White-label option',
    ],
    notIncluded: [],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-28 bg-kelo-surface dark:bg-[#0D0D0D] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-kelo-border dark:border-white/10 bg-white dark:bg-white/5 text-xs font-kelo-mono font-semibold text-kelo-muted dark:text-white/40 tracking-widest uppercase">
            Simple pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-kelo-ink dark:text-white leading-[1.08] tracking-tight mb-4">
            No per-seat nonsense.
            <br />
            <span className="text-kelo-muted dark:text-white/40 font-semibold text-3xl md:text-4xl">Just flat, honest pricing.</span>
          </h2>
          <p className="text-base text-kelo-muted dark:text-white/50 mb-8">
            Start free. Upgrade when you need to. Downgrade anytime.
          </p>

          <div className="inline-flex items-center gap-1 p-1 bg-white dark:bg-white/5 border border-kelo-border dark:border-white/10 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${!annual ? 'bg-kelo-yellow text-kelo-ink shadow-sm' : 'text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${annual ? 'bg-kelo-yellow text-kelo-ink shadow-sm' : 'text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white'}`}
            >
              Annual
              <span className="text-xs font-bold text-kelo-green bg-kelo-green-soft dark:bg-green-500/15 dark:text-green-400 px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} annual={annual} />
          ))}
        </div>

        <div className="flex items-center justify-center mt-10">
          <a href="#" className="text-sm font-semibold text-kelo-ink dark:text-white underline underline-offset-2 hover:text-kelo-yellow-dark transition-colors whitespace-nowrap">
            Compare all features →
          </a>
        </div>
      </div>
    </section>
  );
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  highlight: boolean;
  badge?: string;
  features: string[];
  notIncluded: string[];
}

function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const basePrice = parseInt(plan.price.replace('$', '')) || 0;
  const displayPrice = annual && basePrice > 0 ? `$${Math.round(basePrice * 0.8)}` : plan.price;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.10)] ${
        plan.highlight
          ? 'bg-kelo-ink border-kelo-ink shadow-[0_4px_24px_rgba(0,0,0,0.2)]'
          : 'bg-white dark:bg-[#111111] border-kelo-border dark:border-white/10 hover:border-kelo-border-dark dark:hover:border-white/20'
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-kelo-yellow text-kelo-ink text-xs font-bold rounded-full shadow-sm whitespace-nowrap">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-5">
        <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${plan.highlight ? 'text-kelo-yellow' : 'text-kelo-muted dark:text-white/40'}`}>
          {plan.name}
        </div>
        <div className="flex items-end gap-1 mb-2">
          <span className={`text-4xl font-display font-extrabold leading-none ${plan.highlight ? 'text-white' : 'text-kelo-ink dark:text-white'}`}>
            {displayPrice}
          </span>
          {basePrice > 0 && (
            <span className={`text-sm font-medium mb-0.5 ${plan.highlight ? 'text-white/50' : 'text-kelo-muted dark:text-white/40'}`}>
              {plan.period}
            </span>
          )}
        </div>
        <p className={`text-xs leading-relaxed ${plan.highlight ? 'text-white/60' : 'text-kelo-muted dark:text-white/40'}`}>
          {plan.description}
        </p>
      </div>

      <Link
        href="/signup"
        className={`block text-center py-2.5 px-4 rounded-xl text-sm font-semibold mb-5 transition-all duration-200 ${
          plan.highlight
            ? 'bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark shadow-[0_2px_12px_rgba(245,197,24,0.4)]'
            : 'bg-kelo-surface dark:bg-white/[0.08] border border-kelo-border dark:border-white/10 text-kelo-ink dark:text-white hover:bg-kelo-surface-2 dark:hover:bg-white/[0.12] hover:border-kelo-border-dark dark:hover:border-white/20'
        }`}
      >
        {plan.cta}
      </Link>

      <div className="flex flex-col gap-2.5 flex-1">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-kelo-yellow shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className={`text-sm font-medium ${plan.highlight ? 'text-white/90' : 'text-kelo-ink dark:text-white/80'}`}>{f}</span>
          </div>
        ))}
        {plan.notIncluded.map((f) => (
          <div key={f} className="flex items-start gap-2 opacity-35">
            <svg className="w-3.5 h-3.5 text-kelo-muted shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className={`text-sm ${plan.highlight ? 'text-white/50' : 'text-kelo-muted dark:text-white/40'}`}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
