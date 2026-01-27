import { Suspense } from 'react'
import { AnnouncementBar } from '@/components/widgets/announcement-bar'

function BarContent({ searchParams }: { searchParams: { org?: string; link?: string } }) {
  const org = searchParams.org || ''
  const link = searchParams.link || ''
  return <AnnouncementBar orgSlug={org} link={link} />
}

export default function AnnouncementBarPage({ searchParams }: { searchParams: { org?: string; link?: string } }) {
  return (
    <Suspense fallback={<div />}>
      <BarContent searchParams={searchParams} />
    </Suspense>
  )
}
