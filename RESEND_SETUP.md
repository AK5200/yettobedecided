# Resend Setup - Using Test Domain

## Quick Setup (Using Test Domain)

### 1. Get Your Resend API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Copy your API key (starts with `re_`)

### 2. Add to Environment Variables

Add this to your `.env.local` file:

```env
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=FeedbackHub <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**That's it!** The test domain `onboarding@resend.dev` works immediately without any domain verification.

## How It Works

- ✅ **No domain purchase needed**
- ✅ **No DNS setup required**
- ✅ **Works immediately**
- ✅ **Perfect for development and testing**

All emails will be sent from `FeedbackHub <onboarding@resend.dev>`.

## Testing

1. Make sure your `.env.local` has the `RESEND_API_KEY` set
2. Restart your Next.js dev server
3. Try signing up a new user - you should receive a confirmation email
4. Check Resend Dashboard > Logs to see sent emails

## Email Types That Will Work

- ✅ Signup confirmation emails
- ✅ Password reset emails
- ✅ New post notifications
- ✅ Status change notifications
- ✅ Comment notifications
- ✅ Team invitations

## Important Notes

- The test domain works for **development and testing**
- For production, you'll want to verify your own domain later
- Emails will show as coming from `onboarding@resend.dev`
- No limits on sending (within Resend's free tier)

## Troubleshooting

**If emails aren't sending:**
1. Check that `RESEND_API_KEY` is set correctly
2. Check Resend Dashboard > Logs for error messages
3. Make sure you restarted your dev server after adding env vars

**If you see 403 errors:**
- Make sure you're using `onboarding@resend.dev` (not your Gmail)
- Check that your API key is valid

## Next Steps (For Production Later)

When you're ready for production:
1. Get a domain (free from Freenom or purchase one)
2. Verify it in Resend Dashboard > Domains
3. Update `RESEND_FROM_EMAIL` to use your verified domain

For now, the test domain is perfect! 🚀
