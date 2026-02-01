# Email Sending Options for FeedbackHub

## Current Situation

You want to use `anupamkmr5200@gmail.com` as the sending email, but **Resend doesn't allow sending from Gmail or other personal email addresses**. 

Resend requires **domain verification** for security and deliverability reasons.

## Your Options

### Option 1: Use Resend's Test Domain (Recommended for Now) ✅

**Works immediately, no setup required!**

Update your `.env.local`:
```env
RESEND_FROM_EMAIL=FeedbackHub <onboarding@resend.dev>
```

**Pros:**
- ✅ Works immediately
- ✅ No domain purchase needed
- ✅ Perfect for development/testing
- ✅ Free

**Cons:**
- ⚠️ Emails come from `onboarding@resend.dev` (not your Gmail)
- ⚠️ Limited to testing/development
- ⚠️ Not ideal for production

### Option 2: Get a Free Domain

You can get a free domain and verify it in Resend:

**Free Domain Services:**
1. **Freenom** (freenom.com) - Free `.tk`, `.ml`, `.ga`, `.cf` domains
2. **No-IP** (noip.com) - Free subdomains
3. **DuckDNS** (duckdns.org) - Free subdomains

**Steps:**
1. Get a free domain (e.g., `feedbackhub.tk` or `feedbackhub.duckdns.org`)
2. Add it to Resend Dashboard > Domains
3. Add DNS records (SPF, DKIM) to your domain
4. Verify domain
5. Use: `RESEND_FROM_EMAIL=FeedbackHub <notifications@yourdomain.tk>`

**Pros:**
- ✅ Free
- ✅ Professional email address
- ✅ Works for production

**Cons:**
- ⚠️ Requires DNS setup
- ⚠️ Free domains may have limitations

### Option 3: Purchase a Domain (~$10-15/year)

**Popular Domain Registrars:**
- **Namecheap** - ~$10/year for `.com`
- **Google Domains** - ~$12/year
- **Cloudflare** - At-cost pricing (~$8-10/year)

**Steps:**
1. Purchase domain (e.g., `feedbackhub.app` or `getfeedbackhub.com`)
2. Add to Resend Dashboard > Domains
3. Add DNS records
4. Verify domain
5. Use: `RESEND_FROM_EMAIL=FeedbackHub <notifications@yourdomain.com>`

**Pros:**
- ✅ Professional
- ✅ Best for production
- ✅ Full control

**Cons:**
- ⚠️ Costs money (~$10-15/year)
- ⚠️ Requires DNS setup

### Option 4: Use Gmail SMTP (Not Recommended)

**Why this won't work:**
- Resend is an API service, not SMTP
- Gmail SMTP has strict rate limits
- Gmail may block automated emails
- Not scalable for production

**If you really need Gmail:**
You'd need to switch from Resend to a different service like:
- Nodemailer with Gmail SMTP (not recommended)
- SendGrid (requires domain verification too)
- Mailgun (requires domain verification too)

## Recommended Path Forward

### For Development/Testing (Now):
```env
RESEND_FROM_EMAIL=FeedbackHub <onboarding@resend.dev>
```

### For Production (Later):
1. Get a free domain from Freenom (e.g., `feedbackhub.tk`)
2. Verify it in Resend
3. Update to: `RESEND_FROM_EMAIL=FeedbackHub <notifications@feedbackhub.tk>`

## Quick Setup with Free Domain

1. **Get Free Domain:**
   - Go to [Freenom](https://www.freenom.com)
   - Search for a domain (e.g., `feedbackhub`)
   - Select `.tk` or `.ml` (free options)
   - Complete registration

2. **Add to Resend:**
   - Go to Resend Dashboard > Domains
   - Add your domain
   - Copy the DNS records

3. **Add DNS Records:**
   - Go to your domain's DNS settings
   - Add SPF and DKIM records from Resend
   - Wait for verification (usually 5-30 minutes)

4. **Update .env.local:**
   ```env
   RESEND_FROM_EMAIL=FeedbackHub <notifications@yourdomain.tk>
   ```

## Current Recommendation

**For now, use the test domain:**
```env
RESEND_FROM_EMAIL=FeedbackHub <onboarding@resend.dev>
```

This works immediately and you can switch to a verified domain later when you're ready for production.

## Why Gmail Won't Work

Resend (and most professional email services) require domain verification because:
- Prevents spam and abuse
- Ensures email deliverability
- Protects sender reputation
- Required by email providers (Gmail, Outlook, etc.)

You cannot bypass this requirement - it's a security feature, not a limitation.
