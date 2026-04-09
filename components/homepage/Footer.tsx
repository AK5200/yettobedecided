'use client';
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#080808] border-t border-kelo-border dark:border-white/8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <Link href="/homeanu" className="flex items-center gap-2 mb-4 group">
              <div className="w-7 h-7 rounded-lg bg-kelo-yellow flex items-center justify-center shadow-sm group-hover:shadow-[0_0_12px_rgba(245,197,24,0.4)] transition-shadow">
                <span className="text-kelo-ink font-display font-extrabold text-sm leading-none">K</span>
              </div>
              <span className="font-display font-bold text-kelo-ink dark:text-white text-base tracking-tight">Kelo</span>
            </Link>
            <p className="text-sm text-kelo-muted dark:text-white/40 leading-relaxed mb-4">
              Feedback management for SaaS founders who actually ship.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-kelo-ink dark:text-white uppercase tracking-wider mb-4">Product</div>
            <ul className="flex flex-col gap-2.5">
              <li><a href="#features" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">Features</a></li>
              <li><a href="#pricing" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">Pricing</a></li>
              <li><a href="#changelog" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">Changelog</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold text-kelo-ink dark:text-white uppercase tracking-wider mb-4">Support</div>
            <ul className="flex flex-col gap-2.5">
              <li><a href="mailto:support@kelohq.com" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center pt-8 border-t border-kelo-border dark:border-white/8">
          <p className="text-xs text-kelo-muted dark:text-white/30">
            © {new Date().getFullYear()} Kelo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
