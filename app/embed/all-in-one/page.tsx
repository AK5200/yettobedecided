import dynamic from 'next/dynamic'

const AllInOneEmbedClient = dynamic(() => import('./all-in-one-client'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  ),
})

export default function AllInOneEmbedPage() {
  return <AllInOneEmbedClient />
}
