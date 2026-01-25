import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Link Expired</h1>
        <p className="text-gray-600 mb-6">
          The magic link has expired or is invalid. Please request a new one.
        </p>
        <Link href="/login">
          <Button>Back to Login</Button>
        </Link>
      </div>
    </div>
  )
}
