import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SETTINGS_LINKS = [
  { name: 'Organization', href: '/settings/organization' },
  { name: 'Team', href: '/settings/team' },
  { name: 'Tags', href: '/settings/tags' },
  { name: 'Webhooks', href: '/settings/webhooks' },
  { name: 'API Keys', href: '/settings/api-keys' },
  { name: 'Integrations', href: '/settings/integrations' },
]

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {SETTINGS_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:bg-gray-50">
              <CardHeader>
                <CardTitle>{link.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Manage {link.name.toLowerCase()} settings.</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
