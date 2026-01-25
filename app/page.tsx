import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-8 py-6 border-b">
        <div className="text-xl font-bold">FeedbackHub</div>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link href="#features">Features</Link>
          <Link href="#pricing">Pricing</Link>
        </nav>
        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>

      <section className="px-8 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Collect feedback. Ship better products.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
          The simple way to collect customer feedback, manage your roadmap, and share updates.
        </p>
        <Button size="lg" asChild>
          <Link href="/signup">Get Started</Link>
        </Button>
      </section>

      <section id="features" className="px-8 py-16 bg-muted/40">
        <h2 className="text-2xl font-semibold text-center mb-10">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6 bg-background">
            <h3 className="font-semibold mb-2">Feedback Boards</h3>
            <p className="text-sm text-muted-foreground">
              Collect and prioritize product feedback in one place.
            </p>
          </div>
          <div className="border rounded-lg p-6 bg-background">
            <h3 className="font-semibold mb-2">Public Roadmap</h3>
            <p className="text-sm text-muted-foreground">
              Share what you are building and keep users informed.
            </p>
          </div>
          <div className="border rounded-lg p-6 bg-background">
            <h3 className="font-semibold mb-2">Changelog</h3>
            <p className="text-sm text-muted-foreground">
              Announce updates and celebrate shipped features.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-8 py-16">
        <h2 className="text-2xl font-semibold text-center mb-10">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Free</h3>
            <p className="text-2xl font-bold mb-4">$0</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>1 board</li>
              <li>Basic roadmap</li>
              <li>Community support</li>
            </ul>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Starter</h3>
            <p className="text-2xl font-bold mb-4">$19</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>3 boards</li>
              <li>Public roadmap</li>
              <li>Email support</li>
            </ul>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Pro</h3>
            <p className="text-2xl font-bold mb-4">$39</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Unlimited boards</li>
              <li>Changelog tools</li>
              <li>Priority support</li>
            </ul>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Business</h3>
            <p className="text-2xl font-bold mb-4">$99</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Team access</li>
              <li>Custom branding</li>
              <li>Dedicated success</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="px-8 py-8 border-t text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} FeedbackHub. All rights reserved.
      </footer>
    </main>
  )
}
