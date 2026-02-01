# FeedbackHub Widget Test Kit

This kit simulates how a **real customer** would integrate FeedbackHub on their website.
Test all authentication modes before launch.

## Quick Start

```bash
# 1. Start FeedbackHub dev server
cd feedbackhub
npm run dev
# Server runs at http://localhost:3000

# 2. Serve the test files (in a separate terminal)
cd feedbackhub/test-kit
npx serve .
# or: python -m http.server 8080

# 3. Open in browser
open http://localhost:8080
```

## Prerequisites

- [ ] FeedbackHub running at `http://localhost:3000`
- [ ] Database migrations run (widget_users table exists)
- [ ] Environment variables set:

```env
# Required for JWT mode
WIDGET_JWT_SECRET=your_jwt_secret_min_32_characters

# Required for Social Login
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

## Test Files

| File | Mode | What it Tests |
|------|------|---------------|
| `test-integration.html` | All modes | **Start here!** Simulates a real SaaS dashboard with mode switching |
| `test-guest.html` | Guest | Anonymous posting, no user identification |
| `test-trust.html` | Trust | Client-side user data, no verification |
| `test-jwt.html` | JWT | Server-signed tokens, verified badge |
| `test-social.html` | OAuth | Google/GitHub login flow |

## How It Works

### SDK Pattern (like Canny/Supahub)

```javascript
// 1. Load SDK
FeedbackHub('init', { workspace: 'acme-corp', boardId: 'abc-123' });

// 2. Identify user (choose one mode):

// Guest Mode - no identify call needed

// Trust Mode - pass data directly (not verified)
FeedbackHub('identify', {
  id: 'user_123',
  email: 'john@example.com',
  name: 'John Smith'
});

// JWT Mode - pass server-signed token (shows ✓ verified badge)
FeedbackHub('identify', {
  ssoToken: 'eyJhbGciOiJIUzI1NiIs...'
});
```

### User Sources in Database

| Source | How Identified | Badge |
|--------|----------------|-------|
| `guest` | No identification | None |
| `identified` | Trust mode (client-side) | None |
| `verified_jwt` | JWT token (server-signed) | ✓ Verified |
| `social_google` | Google OAuth | Avatar |
| `social_github` | GitHub OAuth | Avatar |

## Testing Workflow

### Test 1: Guest Mode
1. Open `test-integration.html`
2. Select "Guest Mode"
3. Submit feedback
4. **Verify:** Post shows "Guest" label, no widget_user created

### Test 2: Trust Mode  
1. Select "Trust Mode"
2. Submit feedback
3. **Verify:** User created with `user_source: identified`, no badge

### Test 3: JWT Mode
1. Select "JWT Mode"
2. Submit feedback
3. **Verify:** User created with `user_source: verified_jwt`, shows ✓ badge

### Test 4: Social Login
1. Open `test-social.html`
2. Click "Login with Google" or "Login with GitHub"
3. Complete OAuth flow
4. Submit feedback
5. **Verify:** User created with `user_source: social_google/github`

## Database Verification

```sql
-- Check widget_users
SELECT id, external_id, email, name, user_source, created_at
FROM widget_users 
WHERE org_id = 'YOUR_ORG_ID' 
ORDER BY created_at DESC;

-- Check posts with user attribution
SELECT p.title, wu.name, wu.user_source
FROM posts p
LEFT JOIN widget_users wu ON p.widget_user_id = wu.id
WHERE p.org_id = 'YOUR_ORG_ID';

-- Check SSO settings
SELECT sso_mode, sso_secret_key IS NOT NULL as has_secret
FROM organizations
WHERE id = 'YOUR_ORG_ID';
```

## Configuration

Update the config in each test file:

```javascript
const CONFIG = {
  FEEDBACKHUB_URL: 'http://localhost:3000',  // Your instance
  ORG_ID: 'YOUR_ORG_ID',                      // From dashboard
  BOARD_ID: 'YOUR_BOARD_ID',                  // From dashboard
  JWT_SECRET: 'your_sso_secret'               // From SSO settings
};
```

## Additional Files

- `SDK-SPEC.md` - Full SDK specification (methods, events, API)
- `index.html` - Landing page with setup checklist
