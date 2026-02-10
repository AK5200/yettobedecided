# TaskFlow Integration Guide

This guide will help you integrate FeedbackHub widget into TaskFlow.

## Prerequisites

### 1. Run Database Migrations

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run these migrations in order:
   - `024_widget_users.sql` - Creates widget_users table
   - `026_link_widget_users.sql` - Links posts/comments/votes to widget_users
   - `027_backfill_widget_users.sql` - Backfills existing data (optional)
   - `036_sync_widget_users_counts.sql` - Syncs vote/comment counts (optional)
   - `037_add_time_field.sql` - Adds time field for prioritization

**Option B: Using Supabase CLI**
```bash
cd feedbackhub
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### 2. Get Your Organization Slug

1. Log into FeedbackHub dashboard
2. Go to Settings → Organization
3. Note your organization **slug** (e.g., `taskflow-io`)

### 3. Configure SSO Settings

1. Go to **Settings → SSO** in FeedbackHub dashboard
2. Choose your SSO mode:
   - **Trust Mode** (`trust`): Simple, pass user data directly
   - **JWT Mode** (`jwt_required`): More secure, requires JWT signing
3. Copy the **Secret Key** (for JWT mode)

---

## Integration Steps

### Step 1: Add Widget Script to TaskFlow

Add this to your TaskFlow HTML (before closing `</body>` tag):

```html
<!-- FeedbackHub Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://yettobedecided-8lws.vercel.app/widget.js';
    script.async = true;
    script.dataset.org = 'taskflow-io'; // Replace with your org slug
    script.dataset.type = 'all-in-one-popover'; // or 'all-in-one-popup'
    document.head.appendChild(script);
  })();
</script>
```

### Step 2: Identify Users (Choose One Method)

#### Method A: Trust Mode (Simpler)

When a user logs into TaskFlow, identify them:

```javascript
// After user logs in to TaskFlow
if (window.FeedbackHub && taskflowUser) {
  window.FeedbackHub.identify({
    id: taskflowUser.id,           // TaskFlow user ID
    email: taskflowUser.email,     // Required
    name: taskflowUser.name,       // Optional
    avatar: taskflowUser.avatarUrl, // Optional
    company: {                     // Optional (B2B)
      id: taskflowUser.companyId,
      name: taskflowUser.companyName,
      plan: taskflowUser.plan,
      monthlySpend: taskflowUser.monthlySpend
    }
  });
}
```

#### Method B: JWT Mode (More Secure)

**Backend (Node.js/Express example):**

```javascript
const jwt = require('jsonwebtoken');

// When user logs in to TaskFlow
function generateFeedbackHubToken(taskflowUser, secretKey) {
  return jwt.sign(
    {
      id: taskflowUser.id,
      email: taskflowUser.email,
      name: taskflowUser.name,
      avatar: taskflowUser.avatarUrl,
      company: taskflowUser.company ? {
        id: taskflowUser.company.id,
        name: taskflowUser.company.name,
        plan: taskflowUser.company.plan,
        monthlySpend: taskflowUser.company.monthlySpend
      } : undefined
    },
    secretKey, // From FeedbackHub SSO settings
    { expiresIn: '7d' }
  );
}

// Send token to frontend
app.get('/api/user', (req, res) => {
  const user = getCurrentUser(req);
  const token = generateFeedbackHubToken(user, process.env.FEEDBACKHUB_SECRET_KEY);
  res.json({ user, feedbackHubToken: token });
});
```

**Frontend:**

```javascript
// After fetching user data from TaskFlow API
fetch('/api/user')
  .then(res => res.json())
  .then(data => {
    if (window.FeedbackHub && data.feedbackHubToken) {
      window.FeedbackHub.identify({
        token: data.feedbackHubToken
      });
    }
  });
```

### Step 3: Handle User Logout

When user logs out of TaskFlow:

```javascript
// Clear FeedbackHub identity
if (window.FeedbackHub) {
  window.FeedbackHub.clearIdentity();
}
```

---

## User Data Mapping

### TaskFlow User Object → FeedbackHub

| TaskFlow Field | FeedbackHub Field | Required | Notes |
|---------------|-------------------|----------|-------|
| `user.id` | `id` (external_id) | Yes | TaskFlow user ID |
| `user.email` | `email` | Yes | User email |
| `user.name` | `name` | No | Display name |
| `user.avatarUrl` | `avatar` | No | Avatar URL |
| `user.company.id` | `company.id` | No | Company ID (B2B) |
| `user.company.name` | `company.name` | No | Company name |
| `user.company.plan` | `company.plan` | No | Plan tier |
| `user.company.monthlySpend` | `company.monthlySpend` | No | Monthly spend |

### Auto-Tracked Fields

These are automatically tracked by FeedbackHub:
- `post_count` - Number of feedback posts
- `vote_count` - Number of upvotes given
- `comment_count` - Number of comments
- `first_seen_at` - First interaction timestamp
- `last_seen_at` - Last interaction timestamp

---

## Complete Integration Example

### React/Next.js Example

```tsx
// components/FeedbackHubWidget.tsx
'use client';

import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser'; // Your TaskFlow user hook

export function FeedbackHubWidget() {
  const user = useUser();

  useEffect(() => {
    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://yettobedecided-8lws.vercel.app/widget.js';
    script.async = true;
    script.dataset.org = 'taskflow-io';
    script.dataset.type = 'all-in-one-popover';
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const existing = document.querySelector('script[src*="widget.js"]');
      if (existing) existing.remove();
    };
  }, []);

  useEffect(() => {
    // Identify user when logged in
    if (window.FeedbackHub && user) {
      window.FeedbackHub.identify({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatarUrl,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          plan: user.company.plan,
          monthlySpend: user.company.monthlySpend
        } : undefined
      });
    } else if (window.FeedbackHub && !user) {
      // Clear identity on logout
      window.FeedbackHub.clearIdentity();
    }
  }, [user]);

  return null; // Widget renders itself
}
```

### Vanilla JavaScript Example

```javascript
// feedbackhub-integration.js

(function() {
  // Load widget
  const script = document.createElement('script');
  script.src = 'https://yettobedecided-8lws.vercel.app/widget.js';
  script.async = true;
  script.dataset.org = 'taskflow-io';
  script.dataset.type = 'all-in-one-popover';
  document.head.appendChild(script);

  // Identify user when available
  function identifyUser(user) {
    if (window.FeedbackHub && user) {
      window.FeedbackHub.identify({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatarUrl
      });
    }
  }

  // Listen for user login events
  document.addEventListener('userLoggedIn', (e) => {
    identifyUser(e.detail.user);
  });

  // Listen for user logout events
  document.addEventListener('userLoggedOut', () => {
    if (window.FeedbackHub) {
      window.FeedbackHub.clearIdentity();
    }
  });

  // If user is already logged in
  if (window.currentUser) {
    identifyUser(window.currentUser);
  }
})();
```

---

## Testing Checklist

- [ ] Widget script loads without errors
- [ ] Widget appears on TaskFlow pages
- [ ] User identification works (check browser console)
- [ ] User can submit feedback
- [ ] User can vote on posts
- [ ] User appears in FeedbackHub dashboard → Users
- [ ] User data (name, avatar) displays correctly
- [ ] Logout clears FeedbackHub identity

---

## Troubleshooting

### Widget not appearing
- Check browser console for errors
- Verify `data-org` attribute matches your org slug
- Ensure script is loaded before page interaction

### User not identified
- Check that `window.FeedbackHub.identify()` is called after widget loads
- Verify user data structure matches expected format
- Check browser localStorage for `feedbackhub_user` key

### JWT verification failing
- Verify secret key matches FeedbackHub SSO settings
- Check token expiration (default: 7 days)
- Ensure token includes `id` and `email` fields

---

## Support

For issues or questions:
1. Check FeedbackHub dashboard → Settings → SSO
2. Review browser console for errors
3. Check `widget_users` table in Supabase to verify user creation
