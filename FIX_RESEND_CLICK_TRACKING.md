# Fix: Resend Click Tracking Redirecting Verification Links

## Problem
When clicking the confirmation link in verification emails, users are redirected through Resend's tracking URL instead of directly to Supabase:
```
https://77027507d1fb0b84d755521539d8607a.us-east-1.resend-clicks-a.com/CL0/...
```

This creates a redirect chain that can:
- Break the verification flow
- Cause token expiration issues
- Create a poor user experience

---

## Solution: Disable Click Tracking in Resend

### Option 1: Disable Click Tracking in Resend Dashboard (Recommended)

1. **Go to Resend Dashboard**:
   - Visit [Resend Dashboard](https://resend.com/settings)
   - Navigate to **Settings** → **Email Settings** or **Domain Settings**

2. **Disable Click Tracking**:
   - Look for **"Click Tracking"** or **"Link Tracking"** setting
   - Toggle it **OFF** or set to **"Disabled"**
   - Save changes

3. **Alternative: Per-Domain Settings**:
   - If using a custom domain (`blinno.app`), go to **Domains**
   - Click on your domain
   - Look for click tracking settings
   - Disable it for that domain

### Option 2: Disable in Resend API (If Using Edge Functions)

If you're using the `verification-email` edge function, you can disable tracking per email:

```typescript
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify({
    from: "Blinno <noreply@blinno.app>",
    to: [email],
    subject: "Verify your Blinno account",
    html: emailHtml,
    // Disable click tracking
    click_tracking: false,
  }),
});
```

**Note**: This only works if you're using the REST API directly. Supabase Auth uses SMTP, so you need to disable it in Resend Dashboard.

---

## Why This Happens

Resend automatically adds click tracking to all links in emails sent via SMTP. This is useful for analytics but breaks Supabase's single-use verification tokens because:

1. User clicks link in email
2. Resend intercepts and redirects to tracking URL
3. Resend then redirects to Supabase verification URL
4. By the time it reaches Supabase, the token may be expired or already used

---

## Verification

After disabling click tracking:

1. **Test Signup**:
   - Create a new test account
   - Check the verification email
   - Click the confirmation link
   - Should go directly to Supabase (no Resend tracking URL)

2. **Check Link Format**:
   - The link should look like:
     ```
     https://mzwopjynqugexusmklxt.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=...
     ```
   - NOT like:
     ```
     https://77027507d1fb0b84d755521539d8607a.us-east-1.resend-clicks-a.com/...
     ```

---

## Alternative Solutions

### Option 3: Use Custom Email Template with Direct Link

If you can't disable click tracking, you can modify the email template in Supabase Dashboard to use a custom redirect page:

1. **Create a redirect page** on your site (e.g., `/verify-redirect`)
2. **Update email template** to link to your page instead:
   ```html
   <a href="{{ .SiteURL }}/verify-redirect?token={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}">
     Verify Email Address
   </a>
   ```
3. **On your redirect page**, extract the token and call Supabase's verify endpoint

This bypasses Resend's click tracking but adds complexity.

---

## Important Notes

- **Supabase Documentation** specifically recommends disabling link tracking when using custom SMTP
- Click tracking is useful for marketing emails but problematic for authentication emails
- Disabling click tracking won't affect your ability to send emails
- You can still track email opens (if enabled separately)

---

## Next Steps

1. ✅ Disable click tracking in Resend Dashboard
2. ✅ Test a new signup to verify the fix
3. ✅ Confirm links go directly to Supabase

---

## Still Having Issues?

If disabling click tracking doesn't work:

1. **Check Resend Dashboard** → **Settings** → Verify tracking is disabled
2. **Check Domain Settings** → If using custom domain, disable tracking there too
3. **Contact Resend Support** → They can help disable tracking at account level
4. **Check Supabase Logs** → Verify verification requests are reaching Supabase

