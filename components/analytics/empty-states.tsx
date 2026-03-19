import { FileText, ThumbsUp, BarChart2 } from 'lucide-react'

export function EmptyNoPosts() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-muted-foreground/60 mb-4" />
      <p className="text-sm font-medium text-foreground mb-1">No posts yet</p>
      <p className="text-xs text-muted-foreground">Posts will appear here once created</p>
    </div>
  )
}

export function EmptyNoVotes() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ThumbsUp className="h-12 w-12 text-muted-foreground/60 mb-4" />
      <p className="text-sm font-medium text-foreground mb-1">No votes yet</p>
      <p className="text-xs text-muted-foreground">Votes will appear here once users start voting</p>
    </div>
  )
}

export function EmptyNoData({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart2 className="h-12 w-12 text-muted-foreground/60 mb-4" />
      <p className="text-sm font-medium text-foreground mb-1">No data available</p>
      <p className="text-xs text-muted-foreground">{message || 'Data will appear here once available'}</p>
    </div>
  )
}
