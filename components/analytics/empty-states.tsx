import { FileText, ThumbsUp, BarChart2 } from 'lucide-react'

export function EmptyNoPosts() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-gray-400 mb-4" />
      <p className="text-sm font-medium text-gray-900 mb-1">No posts yet</p>
      <p className="text-xs text-gray-500">Posts will appear here once created</p>
    </div>
  )
}

export function EmptyNoVotes() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ThumbsUp className="h-12 w-12 text-gray-400 mb-4" />
      <p className="text-sm font-medium text-gray-900 mb-1">No votes yet</p>
      <p className="text-xs text-gray-500">Votes will appear here once users start voting</p>
    </div>
  )
}

export function EmptyNoData({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart2 className="h-12 w-12 text-gray-400 mb-4" />
      <p className="text-sm font-medium text-gray-900 mb-1">No data available</p>
      <p className="text-xs text-gray-500">{message || 'Data will appear here once available'}</p>
    </div>
  )
}
