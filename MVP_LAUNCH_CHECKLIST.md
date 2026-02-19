# FeedbackHub — MVP Launch Checklist

**Last Updated**: Feb 19, 2026
**Overall Readiness**: ~75% — Core features complete, needs security hardening + polish
**Estimated Remaining Work**: 3-5 days focused effort

---

## What's Done (Complete)

### Core Platform
- [x] Next.js 14 App Router + TypeScript + Tailwind
- [x] Supabase auth (email/password, Google OAuth, GitHub OAuth)
- [x] Organization & team management (owner, admin roles)
- [x] Board CRUD with settings (name, description, visibility)
- [x] Post CRUD with statuses, tags, votes, comments
- [x] Changelog with rich editor, publish/draft, public page
- [x] Public roadmap view (grouped by status)
- [x] Analytics dashboard (timeseries, trending, stale, prioritization matrix)
- [x] Moderation panel (ban users/emails, manage content)
- [x] User management page
- [x] Prioritization matrix (impact vs effort)

### Widget & Embed System
- [x] Embeddable feedback widget (all-in-one, popup, inline)
- [x] Changelog popup, dropdown, announcement bar widgets
- [x] Widget authentication (Google, GitHub, magic link, guest, SSO/JWT)
- [x] Widget configuration UI with live preview
- [x] Comprehensive widget documentation page (`/widgets/docs`)
- [x] `embed.js` script for external websites

### Integrations
- [x] Slack OAuth + channel notifications
- [x] Linear OAuth + auto-sync posts to issues
- [x] Custom webhooks (Discord, Teams, Telegram, generic)
- [x] API keys for external access (`/api/v1/posts`)

### Settings
- [x] Organization settings (name, slug)
- [x] Team management (invite via email, role assignment)
- [x] SSO / User identification settings
- [x] Board management
- [x] Status management (custom statuses, reorder, colors)
- [x] Tag management
- [x] Changelog settings
- [x] Roadmap settings
- [x] Webhook configuration
- [x] API key management

### Pages
- [x] Landing page with hero, features, pricing tiers
- [x] Pricing page (Free, Starter, Pro, Business)
- [x] Login / Signup / Forgot password / Reset password
- [x] 404 page
- [x] Auth error page
- [x] Public org page (`/:orgSlug`)
- [x] Public board page (`/:orgSlug/:boardSlug`)
- [x] Public features page (`/:orgSlug/features`)
- [x] Public roadmap page (`/:orgSlug/roadmap`)
- [x] Public changelog page (`/:orgSlug/changelog`)

### Onboarding (New)
- [x] 6-step setup guide (Org, Board, Widget, Identity, Integrations, Team)
- [x] Progress tracking in Supabase
- [x] Sidebar "Setup Guide" with animated indicator
- [x] Soft redirect from `/dashboard` until complete
- [x] Clickable step navigation (go back to any step)
- [x] Skip options on each step
- [x] Confetti celebration on completion

---

## Phase 1: Must Fix Before Launch

> These are blockers. Ship nothing without these.

### Security & Stability

- [ ] **Fix root layout metadata**
  File: `app/layout.tsx`
  Currently says "Create Next App" — update to FeedbackHub branding + description

- [ ] **Fix CORS wildcard fallback**
  File: `lib/cors.ts` line ~39
  Falls back to `*` if origin not in allowlist — should reject instead

- [ ] **Add error boundaries**
  Create `app/error.tsx` and `app/(dashboard)/error.tsx`
  Unhandled errors currently show raw React error screen

- [ ] **Implement rate limiting**
  Protect: `/api/auth/signup`, `/api/auth/widget/magic-link`, `/api/widget/feedback`, `/api/widget/vote`, `/api/comments`
  Use Upstash Ratelimit or Vercel's built-in rate limiting

- [ ] **Remove/gate destructive debug routes**
  - `app/api/changelog/seed/route.ts` — seed data route, remove or gate behind admin check
  - `app/api/posts/[id]/reset/route.ts` — deletes all comments+votes
  - `app/api/posts/[id]/reset-votes/route.ts`
  - `app/api/posts/[id]/reset-comments/route.ts`

### Code Cleanup

- [ ] **Remove console.log statements** (or wrap in `NODE_ENV === 'development'`)
  Files with console statements:
  - `lib/integrations/notify.ts` (6 occurrences)
  - `lib/linear/auto-sync.ts` (4 occurrences)
  - `lib/email/triggers.ts` (5 occurrences)
  - `lib/email/resend.ts` (2 occurrences)
  - `lib/webhooks/fire.ts` (2 occurrences)
  - `app/api/posts/route.ts` (2 occurrences)
  - `app/api/posts/[id]/route.ts`
  - `app/api/posts/[id]/merge/route.ts`
  - `app/api/posts/[id]/sync-linear/route.ts`
  - `app/api/integrations/slack/channels/route.ts`

- [ ] **Delete test SQL files from root**
  Move or delete: `create_test_user.sql`, `create_org_only.sql`, `check_user_setup.sql`, `quick_fix_sarah.sql`, `cleanup_duplicate_orgs.sql`

- [ ] **Delete unused markdown files from root**
  Review and remove if stale: `QUICK_START.md`, `REDESIGN_NOTES.md`, `REDESIGN_SUMMARY.md`, `UI_IMPROVEMENTS.md`, `COMPONENT_API.md`, `PROD-CHECKLIST.md`

- [ ] **Create `.env.example`**
  Document all required env vars:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GITHUB_CLIENT_ID=
  GITHUB_CLIENT_SECRET=
  SLACK_CLIENT_ID=
  SLACK_CLIENT_SECRET=
  LINEAR_CLIENT_ID=
  LINEAR_CLIENT_SECRET=
  RESEND_API_KEY=
  EMAIL_FROM=FeedbackHub <noreply@yourdomain.com>
  ALLOWED_ORIGINS=https://yourdomain.com
  JWT_SECRET=
  FEEDBACKHUB_SSO_SECRET=
  ```

### Database

- [ ] **Run onboarding migration** (`supabase/migrations/043_onboarding_tracking.sql`)
- [ ] **Verify RLS policies** — ensure all tables have proper row-level security
- [ ] **Verify backfill** — existing orgs with boards should be marked `onboarding_completed = true`

### Testing

- [ ] **Test complete signup flow** (email/password → confirmation → onboarding → dashboard)
- [ ] **Test OAuth flows** (Google login, GitHub login)
- [ ] **Test onboarding flow** (all 6 steps, skip, go back, celebration)
- [ ] **Test widget embed** on external site (feedback submission, voting, comments)
- [ ] **Test widget auth** (guest, FeedbackHub OAuth, SSO/JWT)
- [ ] **Test integrations** (Slack notifications, Linear sync, webhooks)
- [ ] **Test email delivery** (signup confirmation, magic link, team invite, password reset)
- [ ] **Test public pages** (org page, board page, features, roadmap, changelog)
- [ ] **Test mobile** (375px+ on all key pages)

---

## Phase 2: Should Fix Before Launch

> Not blockers, but significantly improve quality.

- [ ] **Add SEO metadata to public pages**
  Landing page, pricing, public org/board pages need proper `<title>`, description, OG tags

- [ ] **Configure Resend for production**
  Currently falls back to `onboarding@resend.dev` — set up proper domain and sender

- [ ] **Add input validation**
  Post title/content length limits, email format validation, URL validation on SSO redirect

- [ ] **Plan-based feature limits**
  Free plan = 1 board, Starter = 3 boards, etc.
  Schema has `plan` field but no enforcement logic

- [ ] **Password strength requirements**
  Currently no minimum length or complexity enforced

- [ ] **Add loading states**
  Verify all pages/components show proper loading skeletons

---

## Phase 3: Post-Launch Improvements

> Not needed for MVP, but high-value additions.

- [ ] **Stripe payment integration** — monetize paid tiers
- [ ] **Error tracking** — Sentry or LogRocket
- [ ] **Email digests** — weekly feedback summary for admins
- [ ] **In-app notifications** — bell icon, mark as read
- [ ] **Full-text search** — global search across all boards
- [ ] **Custom domains** — `feedback.yourapp.com`
- [ ] **Bulk operations** — bulk status change, bulk tagging
- [ ] **Test suite** — unit + integration tests
- [ ] **Activity/audit log** — who did what when
- [ ] **Advanced analytics** — user segments, cohort analysis
- [ ] **2FA** — for enterprise accounts
- [ ] **Database query optimization** — add indexes for hot queries
- [ ] **Caching layer** — Redis for frequently accessed data

---

## Environment & Deploy

```bash
# Build
npm run build

# Start
npm start

# Dev
npm run dev
```

**Deploy**: Push to `master` → Vercel auto-deploys
**Database**: Supabase (run migrations via SQL editor)
**Email**: Resend (configure domain + API key)
**Monitoring**: Set up on Vercel dashboard

---

## Notes

- `NEXT_PUBLIC_APP_URL` is unreliable on Vercel — code already derives baseUrl from request headers
- Widget runs in iframe, OAuth uses popup + `postMessage` (Google blocks OAuth in iframes)
- `sessionStorage` stores identified widget user under `feedbackhub_identified_user`
- All widget API routes require CORS headers (`handleOptions`/`withCors` from `lib/cors`)
