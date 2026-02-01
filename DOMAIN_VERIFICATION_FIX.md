# Fix Resend 403 Error - Domain Not Verified

You're seeing `403 Forbidden` errors because your domain isn't verified in Resend. Here's how to fix it:

## Quick Fix (For Testing/Development)

**Option 1: Use Resend's Test Domain (Immediate)**

Update your `.env.local`:

```env
RESEND_FROM_EMAIL=FeedbackHub <onboarding@resend.dev>
```

This works immediately without any domain verification. Perfect for development and testing.

## Production Fix (Verify Your Domain)

### Step 1: Add Domain in Resend

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter your domain (e.g., `yourdomain.com` or `mail.yourdomain.com`)
4. Click **"Add"**

### Step 2: Add DNS Records

Resend will show you DNS records to add. You need to add these to your domain's DNS settings:

#### Required Records:

1. **SPF Record** (Type: TXT)
   ```
   v=spf1 include:resend.com ~all
   ```
   Name: `@` (or your domain root)

2. **DKIM Record** (Type: TXT)
   - Resend will provide a unique DKIM value
   - Name: Usually something like `resend._domainkey`
   - Value: Provided by Resend (looks like `p=...`)

#### Optional but Recommended:

3. **DMARC Record** (Type: TXT)
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```
   Name: `_dmarc`

### Step 3: Verify Domain

1. After adding DNS records, go back to Resend dashboard
2. Click **"Verify"** next to your domain
3. Wait a few minutes (DNS propagation can take up to 48 hours, but usually much faster)
4. Once verified, you'll see a green checkmark ✅

### Step 4: Update Environment Variable

Once verified, update your `.env.local`:

```env
RESEND_FROM_EMAIL=FeedbackHub <notifications@yourdomain.com>
```

Replace `yourdomain.com` with your actual verified domain.

## Common DNS Providers

### Cloudflare
- Go to DNS > Records
- Add the TXT records provided by Resend

### GoDaddy
- Go to DNS Management
- Add TXT records

### Namecheap
- Go to Advanced DNS
- Add TXT records

### AWS Route 53
- Go to Hosted Zones
- Create Record Set (Type: TXT)

## Testing

After updating your `.env.local`:

1. Restart your Next.js dev server
2. Try sending a test email (signup, password reset, etc.)
3. Check Resend dashboard > Logs to see if emails are sending successfully
4. No more 403 errors = domain is verified! ✅

## Still Getting 403?

1. **Check DNS propagation**: Use [MXToolbox](https://mxtoolbox.com/TXTLookup.aspx) to verify your DNS records are live
2. **Wait longer**: DNS can take up to 48 hours (though usually much faster)
3. **Double-check records**: Make sure you copied the exact values from Resend
4. **Use test domain**: For immediate testing, use `onboarding@resend.dev`

## Current Status

Based on your logs, you're getting 403 errors. To fix immediately:

```env
# Add this to .env.local
RESEND_FROM_EMAIL=FeedbackHub <onboarding@resend.dev>
```

Then restart your server and try again!
