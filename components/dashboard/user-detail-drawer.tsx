 'use client'
 
 import { useEffect, useState } from 'react'
 import { createClient } from '@/lib/supabase/client'
 import { Button } from '@/components/ui/button'
 import { Badge } from '@/components/ui/badge'
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
 import { Input } from '@/components/ui/input'
 import { toast } from 'sonner'
 
 type UserSource = 'guest' | 'social_google' | 'social_github' | 'identified' | 'verified_jwt'
 
 interface WidgetUser {
   id: string
   email: string
   name: string | null
   avatar_url: string | null
   user_source: UserSource
   company_name: string | null
   company_plan: string | null
   company_monthly_spend: number | null
   first_seen_at: string
   last_seen_at: string
   post_count: number
   vote_count: number
   comment_count: number
   is_banned: boolean
   banned_reason: string | null
 }
 
interface RecentPost {
  id: string
  title: string
  created_at: string
  boards?: { name: string }[] | null
}
 
 interface UserDetailDrawerProps {
   user: WidgetUser | null
   onOpenChange: (open: boolean) => void
   onUserUpdated: (user: WidgetUser) => void
 }
 
 export function UserDetailDrawer({ user, onOpenChange, onUserUpdated }: UserDetailDrawerProps) {
   const supabase = createClient()
   const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
   const [loadingPosts, setLoadingPosts] = useState(false)
   const [banReason, setBanReason] = useState('')
   const [banLoading, setBanLoading] = useState(false)
 
   useEffect(() => {
     if (!user?.id) return
     const fetchRecentPosts = async () => {
       setLoadingPosts(true)
       const { data } = await supabase
         .from('posts')
         .select('id, title, created_at, boards(name)')
         .eq('widget_user_id', user.id)
         .order('created_at', { ascending: false })
         .limit(5)
       setRecentPosts(data || [])
       setLoadingPosts(false)
     }
     fetchRecentPosts()
   }, [user?.id])
 
   const handleBanToggle = async () => {
     if (!user) return
     setBanLoading(true)
     try {
       const response = await fetch(`/api/widget-users/${user.id}/ban`, {
         method: user.is_banned ? 'DELETE' : 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: user.is_banned ? undefined : JSON.stringify({ reason: banReason || undefined }),
       })
 
       if (!response.ok) {
         throw new Error('Failed to update ban status')
       }
 
       const updated: WidgetUser = {
         ...user,
         is_banned: !user.is_banned,
         banned_reason: user.is_banned ? null : banReason || null,
       }
       onUserUpdated(updated)
       toast.success(user.is_banned ? 'User unbanned' : 'User banned')
       if (!user.is_banned) setBanReason('')
     } catch (error) {
       toast.error('Failed to update ban status')
     } finally {
       setBanLoading(false)
     }
   }
 
   if (!user) return null
 
   return (
     <Dialog open={!!user} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl">
         <DialogHeader>
           <DialogTitle>User Details</DialogTitle>
         </DialogHeader>
 
         <div className="flex items-center gap-4">
           {user.avatar_url ? (
             <img
               src={user.avatar_url}
               alt={user.name || user.email}
               className="w-14 h-14 rounded-full object-cover"
             />
           ) : (
             <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-600">
               {(user.name || user.email || '?')[0].toUpperCase()}
             </div>
           )}
           <div>
             <div className="text-lg font-semibold">{user.name || user.email}</div>
             <div className="text-sm text-gray-500">{user.email}</div>
             <div className="mt-1">
               <Badge variant={user.is_banned ? 'destructive' : 'secondary'}>
                 {user.is_banned ? 'Banned' : user.user_source}
               </Badge>
             </div>
           </div>
         </div>
 
         <div className="grid grid-cols-3 gap-4 text-sm">
           <div>
             <div className="text-gray-500">Posts</div>
             <div className="font-medium">{user.post_count}</div>
           </div>
           <div>
             <div className="text-gray-500">Votes</div>
             <div className="font-medium">{user.vote_count}</div>
           </div>
           <div>
             <div className="text-gray-500">Comments</div>
             <div className="font-medium">{user.comment_count}</div>
           </div>
         </div>
 
         <div className="grid grid-cols-2 gap-4 text-sm">
           <div>
             <div className="text-gray-500">First seen</div>
             <div className="font-medium">{new Date(user.first_seen_at).toLocaleString()}</div>
           </div>
           <div>
             <div className="text-gray-500">Last seen</div>
             <div className="font-medium">{new Date(user.last_seen_at).toLocaleString()}</div>
           </div>
         </div>
 
         {user.company_name && (
           <div className="rounded-lg border p-3 text-sm">
             <div className="font-medium">{user.company_name}</div>
             {user.company_plan && <div className="text-gray-500">Plan: {user.company_plan}</div>}
             {user.company_monthly_spend != null && (
               <div className="text-gray-500">Spend: ${user.company_monthly_spend}</div>
             )}
           </div>
         )}
 
         <div className="space-y-2">
           <div className="text-sm font-medium">Recent posts</div>
           {loadingPosts ? (
             <div className="text-sm text-gray-500">Loading posts...</div>
           ) : recentPosts.length === 0 ? (
             <div className="text-sm text-gray-500">No posts yet.</div>
           ) : (
             <div className="space-y-2">
               {recentPosts.map((post) => (
                 <div key={post.id} className="text-sm">
                   <div className="font-medium">{post.title}</div>
                   <div className="text-gray-500">
                    {post.boards?.[0]?.name || 'Board'} · {new Date(post.created_at).toLocaleDateString()}
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
 
         <div className="space-y-2 border-t pt-4">
           <div className="text-sm font-medium">{user.is_banned ? 'Unban user' : 'Ban user'}</div>
           {!user.is_banned && (
             <Input
               placeholder="Ban reason (optional)"
               value={banReason}
               onChange={(event) => setBanReason(event.target.value)}
             />
           )}
           <Button variant={user.is_banned ? 'outline' : 'destructive'} onClick={handleBanToggle} disabled={banLoading}>
             {banLoading ? 'Saving...' : user.is_banned ? 'Unban user' : 'Ban user'}
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   )
 }
