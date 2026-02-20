# Component API Reference

Quick reference for the redesigned components.

---

## 📦 Component Structure

```
components/boards/
├── boards-list-redesign.tsx          # Main boards list page
├── board-detail-redesign.tsx         # Individual board page wrapper
├── board-posts-list-redesign.tsx     # List view for posts
├── post-card-redesign.tsx            # Individual post card
└── kanban-board-redesign.tsx         # Kanban view
```

---

## 🎨 BoardsListRedesign

**File:** `components/boards/boards-list-redesign.tsx`

### Props
```typescript
interface BoardsListRedesignProps {
  activeBoards: Board[]
  archivedBoards: Board[]
}
```

### Features
- ✨ Hero section with stats
- 🔍 Real-time search
- 🎭 Grid/List view toggle
- 📊 Active/Archived toggle
- 🖱️ Hover actions menu
- 📱 Fully responsive

### Usage
```tsx
import { BoardsListRedesign } from '@/components/boards/boards-list-redesign'

<BoardsListRedesign
  activeBoards={activeBoards}
  archivedBoards={archivedBoards}
/>
```

### State Management
```typescript
const [searchQuery, setSearchQuery] = useState('')
const [showArchived, setShowArchived] = useState(false)
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
```

---

## 🎯 BoardDetailRedesign

**File:** `components/boards/board-detail-redesign.tsx`

### Props
```typescript
interface BoardDetailRedesignProps {
  boardId: string
  boardName: string
  boardDescription: string | null
  orgId: string
  pendingPosts: Post[]
  approvedPosts: Post[]
  allPosts: Post[]
  adminEmail: string
}
```

### Features
- 📌 Sticky header with breadcrumbs
- 🔍 Advanced filtering
- 📊 Inline stats badges
- 🎭 List/Kanban view toggle
- ✅ Clear filters button
- 🎨 URL state management

### Usage
```tsx
import { BoardDetailRedesign } from '@/components/boards/board-detail-redesign'

<BoardDetailRedesign
  boardId={id}
  boardName={board.name}
  boardDescription={board.description}
  orgId={board.org_id}
  pendingPosts={filteredPending}
  approvedPosts={filteredApproved}
  allPosts={filteredAll}
  adminEmail={user?.email || ''}
/>
```

### URL Parameters
- `view` — 'list' | 'kanban'
- `q` — Search query
- `status` — Status filter
- `sort` — Sort option

---

## 📝 BoardPostsListRedesign

**File:** `components/boards/board-posts-list-redesign.tsx`

### Props
```typescript
interface BoardPostsListRedesignProps {
  boardId: string
  orgId: string
  pendingPosts: Post[]
  approvedPosts: Post[]
  adminEmail: string
}
```

### Features
- 📋 Separated sections (Pending/Approved)
- 🎨 Visual section headers
- 🔄 Auto-refresh on updates
- 📱 Responsive layout

### Usage
```tsx
import { BoardPostsListRedesign } from '@/components/boards/board-posts-list-redesign'

<BoardPostsListRedesign
  boardId={boardId}
  orgId={orgId}
  pendingPosts={pendingPosts}
  approvedPosts={approvedPosts}
  adminEmail={adminEmail}
/>
```

---

## 🎴 PostCardRedesign

**File:** `components/boards/post-card-redesign.tsx`

### Props
```typescript
interface PostCardRedesignProps {
  post: Post
  orgId: string
  onUpdate: () => void
  isAdmin?: boolean
  adminEmail?: string
  isPending?: boolean
}
```

### Features
- ⬆️ Interactive vote button
- 📌 Pin indicator
- 👤 User avatar with fallback
- 📅 Date display
- 🏷️ Tag selector integration
- ⚙️ Admin actions menu
- ✅ Approve/Reject buttons (pending)
- 🎨 Status dropdown
- 🖱️ Rich hover states

### Usage
```tsx
import { PostCardRedesign } from '@/components/boards/post-card-redesign'

<PostCardRedesign
  post={post}
  orgId={orgId}
  onUpdate={fetchPosts}
  isAdmin={true}
  adminEmail={adminEmail}
  isPending={false}
/>
```

### Actions Available
- Change status (dropdown)
- Approve post (pending only)
- Reject post (pending only)
- Pin/Unpin post
- Delete post

---

## 📊 KanbanBoardRedesign

**File:** `components/boards/kanban-board-redesign.tsx`

### Props
```typescript
interface KanbanBoardRedesignProps {
  posts: Post[]
  isAdmin?: boolean
  adminEmail?: string
  boardId: string
}
```

### Features
- 🌈 Color-coded columns
- 📊 Column stats (count + votes)
- 👀 Public/Admin view toggle
- 🎨 Gradient headers
- 📜 Scrollable columns
- 🎯 Drag-and-drop ready design
- 💫 Smooth animations

### Usage
```tsx
import { KanbanBoardRedesign } from '@/components/boards/kanban-board-redesign'

<KanbanBoardRedesign
  posts={allPosts}
  isAdmin={true}
  adminEmail={adminEmail}
  boardId={boardId}
/>
```

### View Modes
- **Admin View** — Shows all statuses
- **Public View** — Only shows statuses marked for roadmap

---

## 🎨 Design Tokens

### Colors
```typescript
const statusColors: Record<string, string> = {
  open: '#6B7280',
  in_progress: '#3B82F6',
  planned: '#F59E0B',
  completed: '#10B981',
  closed: '#EF4444',
}
```

### Gradients
```tsx
className="bg-gradient-to-br from-blue-50 to-blue-100/50"
```

### Shadows
```tsx
className="shadow-sm hover:shadow-lg transition-shadow"
```

### Transitions
```tsx
className="transition-all duration-200"
```

---

## 🔌 Integration Points

### API Endpoints Used

#### Fetch Statuses
```typescript
GET /api/statuses
Response: { statuses: Status[] }
```

#### Update Post Status
```typescript
PATCH /api/posts/[id]
Body: { status: string }
```

#### Approve Post
```typescript
POST /api/posts/[id]/approve
```

#### Pin/Unpin Post
```typescript
POST /api/posts/[id]/pin
Body: { is_pinned: boolean }
```

#### Archive/Unarchive Board
```typescript
PATCH /api/boards/[id]
Body: { is_archived: boolean }
```

---

## 🎯 Common Patterns

### Loading State
```tsx
const [isUpdating, setIsUpdating] = useState(false)

const handleAction = async () => {
  setIsUpdating(true)
  try {
    await performAction()
  } finally {
    setIsUpdating(false)
  }
}
```

### Error Handling
```tsx
import { toast } from 'sonner'

try {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error()
  toast.success('Action completed')
} catch (error) {
  toast.error('Action failed')
}
```

### Conditional Rendering
```tsx
{items.length === 0 ? (
  <EmptyState />
) : (
  <ItemList items={items} />
)}
```

### Hover Actions
```tsx
<div className="group relative">
  <Content />
  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
    <Actions />
  </div>
</div>
```

---

## 📱 Responsive Utilities

### Grid Layouts
```tsx
// Auto-responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Fixed column widths for Kanban
<div className="flex gap-4 overflow-x-auto">
  <div className="flex-shrink-0 w-[340px]">
```

### Container Max Width
```tsx
<div className="max-w-7xl mx-auto px-8">
```

### Sticky Elements
```tsx
<div className="sticky top-0 z-20">
```

---

## 🎨 Icon Usage

### Common Icons
```tsx
import {
  Plus,           // Create actions
  Search,         // Search functionality
  Filter,         // Filter options
  ArrowUpDown,    // Sort options
  LayoutList,     // List view
  LayoutGrid,     // Grid/Kanban view
  Settings,       // Settings page
  MoreVertical,   // More actions menu
  ChevronUp,      // Upvote
  Pin,            // Pinned posts
  Calendar,       // Dates
  MessageSquare,  // Comments
  TrendingUp,     // Votes/stats
  Check,          // Approve
  X,              // Reject/Close
  Eye,            // Public view
  EyeOff,         // Admin view
  Circle,         // Status indicator
} from 'lucide-react'
```

### Icon Sizing
```tsx
// Small (buttons, inline)
<Icon className="h-3.5 w-3.5" />

// Medium (default)
<Icon className="h-4 w-4" />

// Large (empty states)
<Icon className="h-8 w-8" />
```

---

## 🔧 Customization

### Extend Colors
Add new status colors in the component:
```typescript
const statusColors: Record<string, string> = {
  // ... existing colors
  custom_status: '#YOUR_HEX_COLOR',
}
```

### Modify Gradients
```tsx
// Change stat card gradients
<div className="bg-gradient-to-br from-[YOUR_COLOR]-50 to-[YOUR_COLOR]-100/50">
```

### Adjust Spacing
```tsx
// Card grid gap
<div className="grid ... gap-4">  // Change to gap-6, gap-8, etc.

// Column width
<div className="w-[340px]">  // Change to w-[360px], etc.
```

---

## 🎯 Performance Tips

### Memoize Expensive Computations
```tsx
const filteredData = useMemo(() => {
  return data.filter(item => matchesFilter(item))
}, [data, filters])
```

### Prevent Unnecessary Rerenders
```tsx
useEffect(() => {
  setPosts(initialPosts)
}, [initialPosts])  // Only update when data changes
```

### Debounce Search
```tsx
const debouncedSearch = useMemo(
  () => debounce((value: string) => handleSearch(value), 300),
  []
)
```

---

## 🎉 Tips & Tricks

### Quick Styling
```tsx
// Hover lift effect
className="hover:shadow-lg hover:-translate-y-0.5 transition-all"

// Subtle gradient background
className="bg-gradient-to-br from-gray-50 via-white to-gray-50"

// Frosted glass effect
className="bg-white/80 backdrop-blur-xl"

// Interactive button
className="hover:bg-blue-50 hover:border-blue-400 transition-colors"
```

### Color Indicators
```tsx
// Status dot
<Circle
  className="h-2.5 w-2.5"
  style={{ color: statusColor, fill: statusColor }}
/>
```

### Empty States
```tsx
<div className="flex flex-col items-center justify-center py-20">
  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
    <Icon className="h-8 w-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
  <p className="text-gray-600 text-sm">Description</p>
</div>
```

---

## 📚 Further Reading

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Components](https://www.radix-ui.com)
- [Lucide Icons](https://lucide.dev)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Happy Building!** 🚀
