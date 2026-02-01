# FeedbackHub Widget SDK Specification

Based on analysis of Canny and Supahub patterns, this is how FeedbackHub's widget SDK should work.

## SDK Loading Pattern

```html
<!-- Async loader (like Canny/Supahub) -->
<script>
  !function(f,e,d,b,a,c,k){
    if(!f.FeedbackHub){
      c=e.createElement(d);c.async=1;c.src=b;
      k=e.getElementsByTagName(d)[0];k.parentNode.insertBefore(c,k);
      f.FeedbackHub=function(){(f.FeedbackHub.q=f.FeedbackHub.q||[]).push(arguments)};
    }
  }(window,document,"script","https://YOUR_INSTANCE/widget.js");
</script>
```

## SDK Methods

### `FeedbackHub('init', options)`

Initialize the widget with workspace configuration.

```javascript
FeedbackHub('init', {
  workspace: 'acme-corp',           // Required: workspace slug
  boardId: 'abc-123',               // Optional: default board
  theme: 'light',                   // Optional: 'light' | 'dark' | 'auto'
  position: 'bottom-right',         // Optional: widget position
  primaryColor: '#4f46e5'           // Optional: accent color
});
```

### `FeedbackHub('identify', userData)`

Identify the current user. **Three modes:**

#### Mode 1: Guest (no identify call)
Users post anonymously or enter email manually.

```javascript
// Just init, no identify call
FeedbackHub('init', { workspace: 'acme-corp' });
```

#### Mode 2: Trust Mode (client-side data)
Pass user data directly. Quick setup, but not cryptographically verified.

```javascript
FeedbackHub('identify', {
  id: 'user_12345',                 // Required: unique user ID
  email: 'john@example.com',        // Required: user email
  name: 'John Smith',               // Optional: display name
  avatar: 'https://...',            // Optional: avatar URL
  
  // Optional: custom attributes for segmentation
  plan: 'pro',
  createdAt: '2024-01-15',
  
  // Optional: company data
  company: {
    id: 'company_789',
    name: 'Acme Corp',
    plan: 'enterprise',
    mrr: 2500
  }
});
```

**Result:** User created with `user_source: 'identified'` (no verified badge)

#### Mode 3: JWT Mode (server-signed token)
Pass a server-generated JWT token. Most secure, shows verified badge.

```javascript
FeedbackHub('identify', {
  ssoToken: 'eyJhbGciOiJIUzI1NiIs...'  // JWT token from your server
});
```

**Server-side JWT generation (Node.js):**

```javascript
const jwt = require('jsonwebtoken');

function createFeedbackHubToken(user) {
  return jwt.sign({
    sub: user.id,                   // Required: maps to user ID
    email: user.email,              // Required
    name: user.name,                // Optional
    avatar: user.avatarUrl,         // Optional
    plan: user.plan,                // Optional: custom attribute
    company: {                      // Optional
      id: user.company.id,
      name: user.company.name,
      plan: user.company.plan,
      mrr: user.company.mrr
    }
  }, process.env.FEEDBACKHUB_SSO_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h'
  });
}
```

**Result:** User created with `user_source: 'verified_jwt'` (shows ✓ verified badge)

### `FeedbackHub('clearIdentity')`

Log out the current user (revert to guest mode).

```javascript
FeedbackHub('clearIdentity');
```

### `FeedbackHub('open')`

Programmatically open the feedback widget.

```javascript
document.getElementById('feedback-btn').onclick = () => {
  FeedbackHub('open');
};
```

### `FeedbackHub('close')`

Programmatically close the feedback widget.

### `FeedbackHub('on', event, callback)`

Listen for widget events.

```javascript
FeedbackHub('on', 'feedback:submitted', (post) => {
  console.log('New feedback:', post);
  analytics.track('Feedback Submitted', { postId: post.id });
});

FeedbackHub('on', 'user:identified', (user) => {
  console.log('User identified:', user);
});
```

## API Endpoint: POST /api/widget/feedback

When feedback is submitted, the widget calls this endpoint:

```javascript
// Request body
{
  "org_slug": "acme-corp",
  "board_id": "abc-123",
  "title": "Dark mode support",
  "content": "Please add dark mode to the dashboard",
  
  // User identification (depends on mode)
  "identified_user": {
    // For Trust Mode:
    "id": "user_12345",
    "email": "john@example.com",
    "name": "John Smith",
    "avatar": "https://...",
    "source": "trust"
    
    // For JWT Mode (instead of above):
    // "ssoToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

```javascript
// Response
{
  "success": true,
  "data": {
    "id": "post_xyz",
    "title": "Dark mode support",
    "user_source": "verified_jwt",  // or "identified" or "guest"
    "widget_user": {
      "id": "wu_123",
      "name": "John Smith",
      "verified": true
    }
  }
}
```

## Database: widget_users table

```sql
CREATE TABLE widget_users (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  external_id VARCHAR(255),         -- Customer's user ID
  email VARCHAR(255),
  name VARCHAR(255),
  avatar_url TEXT,
  
  -- Source of identification
  user_source VARCHAR(50) NOT NULL,      -- 'guest' | 'identified' | 'verified_jwt' | 'social_google' | 'social_github'
  
  -- Custom attributes (JSON)
  attributes JSONB,                 -- { plan: 'pro', createdAt: '...' }
  
  -- Company data (JSON)
  company_data JSONB,               -- { id, name, plan, mrr }
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP,
  
  -- For social login
  social_provider VARCHAR(50),
  social_id VARCHAR(255),
  
  UNIQUE(org_id, external_id)
);
```

## Org Settings: SSO Configuration

```sql
-- In organizations table
sso_mode VARCHAR(50) DEFAULT 'guest_only'  -- 'guest_only' | 'trust' | 'jwt_required'
sso_secret_key TEXT                         -- For JWT verification
guest_posting_enabled BOOLEAN DEFAULT true
social_login_enabled BOOLEAN DEFAULT false
```

## User Source Priority

When the same user is identified via multiple methods:

1. **verified_jwt** (highest) - Server-signed, cryptographically verified
2. **social_google** / **social_github** - OAuth verified
3. **identified** - Trust mode, client-provided
4. **guest** (lowest) - Anonymous

If a user posts as guest, then later is identified via JWT, their previous posts should be attributed to the JWT-verified identity.

## Comparison with Competitors

| Feature | Canny | Supahub | FeedbackHub |
|---------|-------|---------|-------------|
| Trust Mode | `Canny('identify', {...})` | `SupahubWidget('identify', {...})` | `FeedbackHub('identify', {...})` |
| JWT Mode | `ssoToken` param | `sso` param with JWT | `ssoToken` param |
| Social Login | ❌ | ❌ | ✅ Google, GitHub |
| Verified Badge | Via SSO only | Via SSO only | ✅ JWT + Social |
| Company Data | ✅ | ✅ | ✅ |
| Custom Attrs | ✅ | ✅ | ✅ |

## Test Checklist

- [ ] Widget loads on customer site
- [ ] Guest mode: submit without identification
- [ ] Trust mode: identify with client-side data
- [ ] JWT mode: identify with server-signed token
- [ ] User appears in widget_users table
- [ ] Correct source is recorded
- [ ] Verified badge shows for JWT users
- [ ] Company data captured
- [ ] Session persists across page reloads
- [ ] clearIdentity() works
- [ ] Events fire correctly
