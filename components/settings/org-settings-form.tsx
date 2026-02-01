'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Building2, Globe, Link2, FileText, Image } from 'lucide-react'

interface OrgSettingsFormProps {
  orgId: string
  initialValues: {
    name: string
    slug: string
    description: string
    website: string
    logoUrl: string
  }
}

export function OrgSettingsForm({ orgId, initialValues }: OrgSettingsFormProps) {
  const [name, setName] = useState(initialValues.name)
  const [slug, setSlug] = useState(initialValues.slug)
  const [description, setDescription] = useState(initialValues.description)
  const [website, setWebsite] = useState(initialValues.website)
  const [logoUrl, setLogoUrl] = useState(initialValues.logoUrl)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const response = await fetch(`/api/organizations/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, description, website, logo_url: logoUrl }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to update organization.')
    } else {
      toast.success('Organization updated!')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Basic Information</h3>
            <p className="text-sm text-gray-500">Your organization's public profile details.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">feedbackhub.com/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme"
                className="flex-1"
                required
              />
            </div>
            <p className="text-xs text-gray-500">This is used in your public feedback hub URL.</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Description</h3>
            <p className="text-sm text-gray-500">Tell users what your organization does.</p>
          </div>
        </div>

        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of your organization..."
          rows={4}
        />
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <Globe className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Website & Branding</h3>
            <p className="text-sm text-gray-500">Links and visual identity.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-gray-400" />
              Website URL
            </Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://acme.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="flex items-center gap-2">
              <Image className="h-4 w-4 text-gray-400" />
              Logo URL
            </Label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://acme.com/logo.png"
            />
            {logoUrl && (
              <div className="mt-2 p-4 bg-gray-50 rounded-lg inline-block">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
