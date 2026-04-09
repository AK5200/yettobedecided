import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#080808] transition-colors duration-300 px-6">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-kelo-yellow/10 dark:bg-kelo-yellow/10 mb-6">
          <span className="text-3xl font-display font-extrabold text-kelo-yellow">?</span>
        </div>
        <h1 className="text-5xl font-display font-extrabold text-kelo-ink dark:text-white tracking-tight mb-3">404</h1>
        <p className="text-base text-kelo-muted dark:text-white/50 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-kelo-yellow text-kelo-ink font-semibold text-sm rounded-xl hover:bg-kelo-yellow-dark transition-all duration-200 shadow-sm hover:shadow-[0_0_20px_rgba(245,197,24,0.4)]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  )
}
