'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Boards', href: '/boards' },
  { name: 'Changelog', href: '/changelog' },
  { name: 'Widgets', href: '/widgets' },
  { name: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-64 border-r min-h-screen p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-8">FeedbackHub</h1>
      <nav className="space-y-2 flex-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${
                isActive ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>
      <Button onClick={handleLogout} className="w-full">
        Logout
      </Button>
    </div>
  )
}
