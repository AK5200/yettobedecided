'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Globe, Link2, FileText, Image, Loader2 } from 'lucide-react'

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
      {/* Basic Information */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2.5 bg-amber-100 rounded-xl group-hover:scale-110 transition-transform">
            <Building2 className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            <p className="text-sm text-gray-500">Your organization&apos;s public profile details.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Organization Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-medium text-gray-700">
              URL Slug
            </Label>
            <div className="flex items-center gap-0">
              <span className="inline-flex items-center h-11 px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 select-none">
                kelo.com/
              </span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme"
                className="flex-1 rounded-l-none h-11"
                required
              />
            </div>
            <p className="text-xs text-gray-400">This is used in your public feedback hub URL.</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Description</h3>
            <p className="text-sm text-gray-500">Tell users what your organization does.</p>
          </div>
        </div>

        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of your organization..."
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Website & Branding */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2.5 bg-green-100 rounded-xl">
            <Globe className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Website & Branding</h3>
            <p className="text-sm text-gray-500">Links and visual identity for your organization.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Link2 className="h-4 w-4 text-gray-400" />
              Website URL
            </Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://acme.com"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Image className="h-4 w-4 text-gray-400" />
              Logo URL
            </Label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://acme.com/logo.png"
              className="h-11"
            />
            {logoUrl && (
              <div className="mt-3 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-16 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-white h-11 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}
