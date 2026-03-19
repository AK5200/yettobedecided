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
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-lg border border-kelo-border dark:border-white/10 flex items-center justify-center text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white hover:border-kelo-border-dark dark:hover:border-white/20 transition-colors" aria-label="Twitter">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg border border-kelo-border dark:border-white/10 flex items-center justify-center text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white hover:border-kelo-border-dark dark:hover:border-white/20 transition-colors" aria-label="GitHub">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-kelo-ink dark:text-white uppercase tracking-wider mb-4">Product</div>
            <ul className="flex flex-col gap-2.5">
              <li><a href="#features" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">Features</a></li>
              <li><a href="#pricing" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">Pricing</a></li>
              <li><a href="#changelog" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">Changelog</a></li>
              <li><a href="#" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">Roadmap</a></li>
              <li><a href="#" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">API Docs</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold text-kelo-ink dark:text-white uppercase tracking-wider mb-4">Company</div>
            <ul className="flex flex-col gap-2.5">
              {['About', 'Blog', 'Careers', 'Press', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold text-kelo-ink dark:text-white uppercase tracking-wider mb-4">Legal</div>
            <ul className="flex flex-col gap-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Security'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white transition-colors font-medium">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-kelo-border dark:border-white/8">
          <p className="text-xs text-kelo-muted dark:text-white/30">
            © {new Date().getFullYear()} Kelo, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-kelo-muted dark:text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-kelo-green animate-pulse-slow" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
