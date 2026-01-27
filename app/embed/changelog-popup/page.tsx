import { Suspense } from 'react'
import { ChangelogPopup } from '@/components/widgets/changelog-popup'

function PopupContent({ searchParams }: { searchParams: { org?: string } }) {
  const org = searchParams.org || ''
  return <ChangelogPopup orgSlug={org} />
}

export default function ChangelogPopupPage({ searchParams }: { searchParams: { org?: string } }) {
  return (
    <Suspense fallback={<div />}>
      <PopupContent searchParams={searchParams} />
    </Suspense>
  )
}
