# Kelo — MVP Launch Checklist

**Last Updated**: Feb 20, 2026
**Overall Readiness**: ~90% — Core features complete, security hardened, major bugs fixed
**Estimated Remaining Work**: 1 day focused effort

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
- [x] `widget.js` script for external websites

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

### Onboarding
- [x] 6-step setup guide (Org, Board, Widget, Identity, Integrations, Team)
- [x] Progress tracking in Supabase
- [x] Sidebar "Setup Guide" with animated indicator
- [x] Soft redirect from `/dashboard` until complete
- [x] Clickable step navigation (go back to any step)
- [x] Skip options on each step
- [x] Confetti celebration on completion

### Security & Bug Fixes (3 Audit Passes — Feb 20, 2026)

#### Authentication & Authorization
- [x] Open redirect vulnerability in `/api/auth/callback` — validates `next` param is relative path
- [x] XSS in widget OAuth popup — `JSON.stringify` with `</script>` escape + specific postMessage origin
- [x] Unauthenticated invitation accept — now uses `supabase.auth.getUser()` instead of trusting request body `user_id`
- [x] All 5 analytics API routes missing auth — added auth + org membership check
- [x] `/api/widget-users` GET missing auth — added auth + org membership check
- [x] Changelog DELETE missing org authorization — cross-org delete vulnerability fixed
- [x] SSO secret key exposed to non-owners — now only returned to org owners

#### Data Security
- [x] Webhook settings body spread — whitelisted allowed fields, added URL validation
- [x] `is_from_admin` spoofable in comments API — now verified server-side
- [x] PostgREST filter injection in post search — sanitized input before `.or()` call
- [x] `/api/posts/[id]` GET returned all columns with no field filtering — filtered to safe fields, blocks unapproved posts
- [x] `/api/widget/route.ts` returned full org row including `sso_secret_key` — filtered to safe columns
- [x] `/api/widget/route.ts` didn't filter unapproved posts — added `.eq('is_approved', true)`
- [x] `next.config.mjs` `hostname: '**'` — restricted to known image hosts (Google, GitHub, Supabase, Gravatar)

#### Widget Security
- [x] `widget.js` localStorage not scoped per org — cross-tenant identity leak fixed (`kelo_user_${org}`)
- [x] `sessionStorage` not scoped per org in all-in-one and post-detail — fixed to `kelo_identified_user_${org}`
- [x] `widget.js` debug `console.log` leaking settings object to customer consoles — removed
- [x] `widget.js` baseUrl broken with query params — fixed to `new URL(script.src).origin`

#### Broken Features Fixed
- [x] Changelog API didn't support org slug — widget changelog widgets were completely broken
- [x] `widget-settings` API missing CORS — all widget customization was ignored on customer sites
- [x] Changelog popup sent wrong close message (`kelo:close` → `kelo:close-changelog`)
- [x] Post delete button had no `onClick` handler
- [x] Kanban status change had no error handling
- [x] Post admin actions missing `response.ok` checks on all 7 handlers
- [x] Comment form used `window.alert` instead of toast
- [x] Dashboard page null user crash before auth check
- [x] Changelog `published_at` overwritten on every edit (now only set on draft→published transition)
- [x] New post page `params` not awaited (Next.js 14 App Router pattern)
- [x] 5 API route files with wrong `params` type signature

#### Email & Webhooks
- [x] Invitation email linked to `/accept-invite?token=` — non-existent page, fixed to `/invite/${token}`
- [x] Email triggers used cookie-based `createClient()` in background context — switched to `createAdminClient()`
- [x] Webhooks fire-and-forget on Vercel serverless — silently dropped; now `await Promise.allSettled()` with 10s timeout

#### Analytics & UX
- [x] Analytics metric cards showing wrong comparison data (votes/comments/users showing posts delta)
- [x] Date range picker "All" option falling back to 30 days instead of 365
- [x] Invite page login/signup links didn't preserve redirect back to invite after auth
- [x] `metadataBase` missing in root layout (OG image URLs broken)
- [x] Pricing page had wrong brand name ("Example" instead of "Kelo")

#### Widget UX
- [x] `hasVoted` always `false` on widget load — users unknowingly removed their own votes; fixed with sessionStorage tracking per org
- [x] Optimistic vote not reverted when no email or API failure
- [x] Optimistic comment not reverted on API failure
- [x] Feedback form submit: no try/catch, loading spinner stuck on network error, no error shown to user
- [x] `hexToRgba` produced `rgba(NaN, NaN, NaN)` for 3-char hex or CSS color names
- [x] `borderRadius: borderRadiusClass` passed Tailwind class name as CSS inline style value
- [x] `orgSlug` not URL-encoded in 5 widget component fetch calls
- [x] Announcement bar dismiss made redundant network fetch for ID it already had

---

## Phase 1: Must Fix Before Launch

> These are blockers. Ship nothing without these.

### Security & Stability

- [ ] **Add error boundaries**
  Create `app/error.tsx` and `app/(dashboard)/error.tsx`
  Unhandled errors currently show raw React error screen in production

- [ ] **Implement rate limiting**
  Protect: `/api/auth/signup`, `/api/auth/widget/magic-link`, `/api/widget/feedback`, `/api/widget/vote`, `/api/comments`
  Use Upstash Ratelimit or Vercel's built-in rate limiting

- [ ] **Gate/remove destructive debug routes**
  - `app/api/changelog/seed/route.ts` — creates duplicate seed data on every call
  - `app/api/posts/[id]/reset/route.ts` — deletes all comments + votes
  - `app/api/posts/[id]/reset-votes/route.ts`
  - `app/api/posts/[id]/reset-comments/route.ts`
  Add admin-only auth check or remove entirely before launch

### Cleanup

- [ ] **Remove remaining console.log statements** (or gate behind `NODE_ENV === 'development'`)
  Still present in:
  - `lib/integrations/notify.ts` (debug logging)
  - `lib/linear/auto-sync.ts`
  - `app/api/posts/route.ts`
  - `app/api/posts/[id]/merge/route.ts`
  - `app/api/posts/[id]/sync-linear/route.ts`

- [ ] **Delete test SQL files from root**
  `create_test_user.sql`, `create_org_only.sql`, `check_user_setup.sql`, `quick_fix_sarah.sql`, `cleanup_duplicate_orgs.sql`

- [ ] **Delete unused markdown files from root**
  `QUICK_START.md`, `REDESIGN_NOTES.md`, `REDESIGN_SUMMARY.md`, `UI_IMPROVEMENTS.md`, `COMPONENT_API.md`

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
  RESEND_FROM_EMAIL=Kelo <noreply@yourdomain.com>
  ALLOWED_ORIGINS=https://yourdomain.com
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
- [ ] **Test widget auth** (guest, Kelo OAuth, SSO/JWT)
- [ ] **Test integrations** (Slack notifications, Linear sync, webhooks)
- [ ] **Test email delivery** (signup confirmation, magic link, team invite, password reset)
- [ ] **Test public pages** (org page, board page, features, roadmap, changelog)
- [ ] **Test mobile** (375px+ on all key pages)

---

## Phase 2: Should Fix Before Launch

> Not blockers, but significantly improve quality.

- [ ] **Configure Resend for production**
  Set `RESEND_FROM_EMAIL` to a verified domain sender (currently falls back to `onboarding@resend.dev`)

- [ ] **Add SEO metadata to public pages**
  Public org/board pages need proper `<title>`, description, OG tags

- [ ] **Plan-based feature limits**
  Free plan = 1 board, Starter = 3 boards, etc. Schema has `plan` field but no enforcement

- [ ] **Password strength requirements**
  Currently no minimum length or complexity enforced on signup

- [ ] **StatusChart board filter**
  Status distribution pie chart ignores the board filter — shows org-wide data even when a board is selected

- [ ] **UserDetailDrawer status key mismatch**
  Status color map uses `in-progress` (hyphen) but DB stores `in_progress` (underscore) — in-progress badge shows wrong color

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
- [ ] **postMessage origin validation** — harden widget against identity spoofing
- [ ] **Dark/auto theme** — widget theme setting is saved but never applied
- [ ] **Prioritize page** — currently a static mockup, drag-and-drop not implemented

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
**Email**: Resend (configure domain + API key via `RESEND_FROM_EMAIL`)
**Monitoring**: Set up on Vercel dashboard

---

## Notes

- `NEXT_PUBLIC_APP_URL` is unreliable on Vercel — code already derives baseUrl from request headers
- Widget runs in iframe, OAuth uses popup + `postMessage` (Google blocks OAuth in iframes)
- `sessionStorage` stores identified widget user under `kelo_identified_user_${orgSlug}` (scoped per org)
- `sessionStorage` stores voted post IDs under `kelo_votes_${orgSlug}` (scoped per org)
- `localStorage` in `widget.js` stores identity under `kelo_user_${org}` (scoped per org)
- All widget API routes require CORS headers (`handleOptions`/`withCors` from `lib/cors`)
- Webhook fire uses `Promise.allSettled` + 10s timeout to prevent silent drops on Vercel serverless
