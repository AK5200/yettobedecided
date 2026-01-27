import { Suspense } from 'react'
import { ChangelogDropdown } from '@/components/widgets/changelog-dropdown'

function DropdownContent({ searchParams }: { searchParams: { org?: string } }) {
  const org = searchParams.org || ''
  return (
    <div className='p-2'>
      <ChangelogDropdown orgSlug={org} />
    </div>
  )
}

export default function ChangelogDropdownPage({ searchParams }: { searchParams: { org?: string } }) {
  return (
    <Suspense fallback={<div />}>
      <DropdownContent searchParams={searchParams} />
    </Suspense>
  )
}
