'use client'

interface BoardSettingsFormProps {
  boardId: string
  initialValues: {
    name: string
    slug: string
    description: string
    isPublic: boolean
  }
}

export function BoardSettingsForm({ initialValues }: BoardSettingsFormProps) {
  return (
    <div className="rounded-lg border p-6 space-y-2">
      <div className="text-sm text-gray-600">Board Name</div>
      <div>{initialValues.name}</div>
    </div>
  )
}
