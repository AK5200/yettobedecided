# Email Setup with Resend

This project uses Resend for sending emails instead of Supabase's default email service.

## Environment Variables

Add these to your `.env.local` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=FeedbackHub <notifications@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Resend Configuration

1. **Get your Resend API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Go to API Keys and create a new key
   - Add it to `RESEND_API_KEY` in your environment variables

2. **Verify your domain (REQUIRED for production):**
   - In Resend dashboard, go to **Domains**
   - Click **Add Domain**
   - Enter your domain (e.g., `yourdomain.com`)
   - Add the DNS records Resend provides to your domain's DNS settings:
     - **SPF Record**: `v=spf1 include:resend.com ~all`
     - **DKIM Record**: (provided by Resend)
     - **DMARC Record**: (optional but recommended)
   - Wait for verification (usually takes a few minutes)
   - Once verified, update `RESEND_FROM_EMAIL`:
     ```
     RESEND_FROM_EMAIL=FeedbackHub <notifications@yourdomain.com>
     ```

3. **Using Resend's test domain (for development/testing):**
   - For testing, you can use `onboarding@resend.dev` (no verification needed)
   - Set: `RESEND_FROM_EMAIL=FeedbackHub <onboarding@resend.dev>`
   - ⚠️ **Note**: This is only for testing. Production emails should use a verified domain.

4. **Troubleshooting 403 Errors:**
   - If you see `403 Forbidden` errors in Resend logs, your domain is not verified
   - Either verify your domain OR use `onboarding@resend.dev` for testing
   - Check Resend dashboard > Logs to see detailed error messages

## Supabase Configuration

### Option 1: Disable Supabase Auth Emails (Recommended)

1. Go to Supabase Dashboard > Authentication > Settings
2. Under "Email Auth", disable "Enable email confirmations"
3. All emails will be sent via Resend through our API routes

### Option 2: Use Resend SMTP in Supabase

1. Go to Supabase Dashboard > Settings > Auth
2. Under "SMTP Settings", configure:
   - **SMTP Host:** `smtp.resend.com`
   - **SMTP Port:** `465` (SSL) or `587` (TLS)
   - **SMTP User:** `resend`
   - **SMTP Password:** Your Resend API key
   - **Sender Email:** Your verified Resend email

## Email Types

The following emails are sent via Resend:

1. **Signup Confirmation** - Sent when a user signs up
2. **Password Reset** - Sent when a user requests password reset
3. **New Post Notification** - Sent to org admins when new feedback is submitted
4. **Status Change Notification** - Sent when post status changes
5. **New Comment Notification** - Sent when a comment is added
6. **Post Merged Notification** - Sent when posts are merged
7. **Team Invitation** - Sent when inviting team members

## Testing

To test emails locally:

1. Make sure `RESEND_API_KEY` is set in `.env.local`
2. Use Resend's test domain: `RESEND_FROM_EMAIL=FeedbackHub <onboarding@resend.dev>`
3. Sign up a new user - check Resend dashboard for sent emails

## Troubleshooting

- **Emails not sending:** Check that `RESEND_API_KEY` is set correctly
- **"From" email rejected:** Make sure the domain is verified in Resend or use `onboarding@resend.dev`
- **Supabase still sending emails:** Disable email confirmations in Supabase Auth settings
