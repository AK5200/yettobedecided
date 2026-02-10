# TaskFlow Integration - Quick Answers

## 1. Migrations Status

**Answer: Migrations need to be run manually in Supabase Dashboard**

The `widget_users` table migration exists but needs to be applied. Since Supabase CLI isn't linked, run these in Supabase SQL Editor:

1. `024_widget_users.sql` - Creates widget_users table
2. `026_link_widget_users.sql` - Links posts/comments/votes
3. `027_backfill_widget_users.sql` - Backfills existing data (optional)
4. `036_sync_widget_users_counts.sql` - Syncs counts (optional)
5. `037_add_time_field.sql` - Adds time field (optional)

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste each migration file content
3. Click "Run"

---

## 2. TaskFlow Authentication

**Answer: TaskFlow can use Trust Mode or JWT Mode**

FeedbackHub widget supports multiple auth methods. For TaskFlow, you have two options:

### Option A: Trust Mode (Simpler)
- Pass user data directly: `{ id, email, name, avatar }`
- No JWT signing required
- Set SSO mode to `trust` in FeedbackHub Settings → SSO

### Option B: JWT Mode (More Secure)
- Sign JWT with TaskFlow user data
- Use shared secret from FeedbackHub
- Set SSO mode to `jwt_required` in FeedbackHub Settings → SSO

**TaskFlow doesn't need to implement OAuth** - that's handled by FeedbackHub if users want to use Google/GitHub login directly in the widget.

---

## 3. User Data Available

**Answer: FeedbackHub can store all standard user fields**

### Required:
- ✅ `email` (string)

### Optional:
- ✅ `id` / `external_id` (string) - TaskFlow user ID
- ✅ `name` (string)
- ✅ `avatar` / `avatar_url` (string)
- ✅ `company.id` (string)
- ✅ `company.name` (string)
- ✅ `company.plan` (string)
- ✅ `company.monthlySpend` (number)

### Auto-Tracked (No need to pass):
- `post_count`, `vote_count`, `comment_count`
- `first_seen_at`, `last_seen_at`

**Example TaskFlow user object:**
```javascript
{
  id: "user_123",
  email: "john@taskflow.com",
  name: "John Doe",
  avatarUrl: "https://taskflow.com/avatars/john.jpg",
  company: {
    id: "company_456",
    name: "Acme Corp",
    plan: "pro",
    monthlySpend: 99.00
  }
}
```

---

## 4. Widget Embedding

**Answer: Widget is NOT embedded yet - needs to be added**

### Quick Integration Code:

```html
<!-- Add before </body> tag -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://yettobedecided-8lws.vercel.app/widget.js';
    script.async = true;
    script.dataset.org = 'taskflow-io'; // Your org slug
    script.dataset.type = 'all-in-one-popover';
    document.head.appendChild(script);
  })();
</script>
```

### Identify User (after login):

```javascript
// Trust Mode
window.FeedbackHub.identify({
  id: taskflowUser.id,
  email: taskflowUser.email,
  name: taskflowUser.name,
  avatar: taskflowUser.avatarUrl
});

// OR JWT Mode
window.FeedbackHub.identify({
  token: generateJWT(taskflowUser, secretKey)
});
```

### Clear Identity (on logout):

```javascript
window.FeedbackHub.clearIdentity();
```

---

## Next Steps Summary

1. ✅ **Run migrations** in Supabase SQL Editor
2. ✅ **Get org slug** from FeedbackHub dashboard
3. ✅ **Configure SSO** in Settings → SSO (choose `trust` or `jwt_required`)
4. ✅ **Copy secret key** (if using JWT mode)
5. ✅ **Add widget script** to TaskFlow HTML
6. ✅ **Call `FeedbackHub.identify()`** when user logs in
7. ✅ **Call `FeedbackHub.clearIdentity()`** when user logs out

---

## Full Documentation

See `TASKFLOW_INTEGRATION.md` for complete integration guide with code examples.
