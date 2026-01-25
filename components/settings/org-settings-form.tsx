'use client'

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

export function OrgSettingsForm({ initialValues }: OrgSettingsFormProps) {
  return (
    <div className="rounded-lg border p-6 space-y-2">
      <div className="text-sm text-gray-600">Name</div>
      <div>{initialValues.name}</div>
    </div>
  )
}
