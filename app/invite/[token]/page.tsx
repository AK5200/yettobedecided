'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id || null)
      setLoading(false)
    }
    fetchUser()
  }, [supabase])

  const handleAccept = async () => {
    if (!userId) return
    setMessage('')
    const response = await fetch('/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token, user_id: userId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      setMessage(errorData.error || 'Failed to accept invitation.')
      return
    }

    router.push('/dashboard')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>Join your team in FeedbackHub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!userId ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Please log in or sign up to accept this invitation.</p>
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">You are signed in and can accept this invitation.</p>
              <Button onClick={handleAccept}>Accept Invitation</Button>
            </div>
          )}
          {message && <p className="text-sm text-red-600">{message}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
