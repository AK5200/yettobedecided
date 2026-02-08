export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>

      {/* Charts row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-gray-100 animate-pulse rounded-xl" />
        <div className="h-80 bg-gray-100 animate-pulse rounded-xl" />
      </div>

      {/* Matrix skeleton */}
      <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    </div>
  )
}
