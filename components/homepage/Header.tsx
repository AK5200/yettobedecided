'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const shrinkProgress = Math.min(scrollY / 300, 1);
  const maxWidth = Math.round(1024 - (1024 - 640) * shrinkProgress);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav
        className={`flex items-center justify-between px-5 transition-all duration-500 ease-out rounded-2xl border ${
          scrolled
            ? 'py-2.5 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] bg-white/98 border-kelo-border dark:bg-[#111111]/98 dark:border-white/10 dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)]'
            : 'py-3 backdrop-blur-md shadow-[0_2px_16px_rgba(0,0,0,0.04)] bg-white/85 border-kelo-border/50 dark:bg-[#0D0D0D]/85 dark:border-white/8 dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]'
        }`}
        style={{
          width: '100%',
          maxWidth: `${maxWidth}px`,
          transition: 'max-width 0.4s cubic-bezier(0.4,0,0.2,1), padding 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <Link href="/homeanu" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-kelo-yellow flex items-center justify-center shadow-sm group-hover:shadow-[0_0_12px_rgba(245,197,24,0.5)] transition-shadow duration-200">
            <span className="text-kelo-ink font-display font-extrabold text-sm leading-none">K</span>
          </div>
          <span
            className="font-display font-bold text-kelo-ink dark:text-white tracking-tight overflow-hidden transition-all duration-400"
            style={{
              fontSize: scrolled ? '0.9375rem' : '1.125rem',
              maxWidth: scrolled && shrinkProgress > 0.7 ? '60px' : '80px',
              transition: 'font-size 0.3s ease, max-width 0.4s ease',
            }}
          >
            Kelo
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="#changelog">Changelog</NavLink>
        </div>

        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
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

          <Link
            href="/login"
            className={`font-medium transition-all duration-200 px-3 py-1.5 rounded-lg ${
              isDark
                ? 'text-white/50 hover:text-white hover:bg-white/8'
                : 'text-kelo-muted hover:text-kelo-ink hover:bg-kelo-surface'
            } ${scrolled ? 'text-xs' : 'text-sm'}`}
            style={{ transition: 'font-size 0.3s ease' }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={`font-semibold bg-kelo-yellow text-kelo-ink rounded-lg hover:bg-kelo-yellow-dark transition-all duration-200 shadow-sm hover:shadow-[0_0_16px_rgba(245,197,24,0.4)] ${scrolled ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}`}
            style={{ transition: 'font-size 0.3s ease, padding 0.3s ease' }}
          >
            Start free
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 ${
              isDark
                ? 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                : 'border-kelo-border bg-kelo-surface text-kelo-muted hover:bg-kelo-surface-2'
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
          <button
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/8' : 'hover:bg-kelo-surface'}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 rounded transition-all duration-200 ${isDark ? 'bg-white' : 'bg-kelo-ink'} ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block h-0.5 rounded transition-all duration-200 ${isDark ? 'bg-white' : 'bg-kelo-ink'} ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block h-0.5 rounded transition-all duration-200 ${isDark ? 'bg-white' : 'bg-kelo-ink'} ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      <div
        className={`absolute top-full mt-2 left-4 right-4 backdrop-blur-xl border rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-4 md:hidden transition-all duration-300 origin-top ${
          isDark
            ? 'bg-[#111111]/98 border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
            : 'bg-white/98 border-kelo-border'
        } ${menuOpen ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none'}`}
      >
        <div className="flex flex-col gap-1">
          <MobileNavLink href="#features" onClick={() => setMenuOpen(false)} isDark={isDark}>Features</MobileNavLink>
          <MobileNavLink href="#pricing" onClick={() => setMenuOpen(false)} isDark={isDark}>Pricing</MobileNavLink>
          <MobileNavLink href="#changelog" onClick={() => setMenuOpen(false)} isDark={isDark}>Changelog</MobileNavLink>
          <div className={`border-t my-2 ${isDark ? 'border-white/10' : 'border-kelo-border'}`} />
          <Link href="/login" className={`px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${isDark ? 'text-white/50 hover:text-white hover:bg-white/8' : 'text-kelo-muted hover:text-kelo-ink hover:bg-kelo-surface'}`}>Log in</Link>
          <Link href="/signup" className="px-3 py-2.5 text-sm font-semibold bg-kelo-yellow text-kelo-ink rounded-xl text-center hover:bg-kelo-yellow-dark transition-colors shadow-sm">Start free</Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-3 py-1.5 text-sm font-medium text-kelo-muted hover:text-kelo-ink dark:text-white/50 dark:hover:text-white rounded-lg hover:bg-kelo-surface dark:hover:bg-white/8 transition-all duration-150 whitespace-nowrap"
    >
      {children}
    </a>
  );
}

function MobileNavLink({ href, children, onClick, isDark }: { href: string; children: React.ReactNode; onClick: () => void; isDark: boolean }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${isDark ? 'text-white/50 hover:text-white hover:bg-white/8' : 'text-kelo-muted hover:text-kelo-ink hover:bg-kelo-surface'}`}
    >
      {children}
    </a>
  );
}
