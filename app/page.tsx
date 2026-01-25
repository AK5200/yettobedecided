export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">FeedbackHub Backend Ready</h1>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
      <p className="text-gray-600 mb-4">All API routes created. Backend setup complete.</p>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Available API Routes:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>POST /api/auth/callback - Auth callback</li>
          <li>GET/POST /api/organizations - Organizations</li>
          <li>GET/POST /api/boards - Boards</li>
          <li>GET/POST /api/posts - Posts</li>
          <li>GET/PATCH /api/posts/[id] - Single post</li>
          <li>GET/POST /api/votes - Votes</li>
          <li>GET/POST /api/comments - Comments</li>
          <li>GET/POST /api/changelog - Changelog</li>
          <li>PATCH/DELETE /api/changelog/[id] - Single changelog</li>
        </ul>
      </div>
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800 text-sm">
          <strong>Next step:</strong> Run the SQL migrations in Supabase SQL editor
        </p>
      </div>
    </main>
  )
}
