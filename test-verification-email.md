# Verification Email Testing Guide

## Overview

The platform uses **Supabase's built-in email system** for verification emails. When a user signs up, Supabase automatically sends a verification email using the template at `supabase/templates/confirmation.html`.

## Email Flow

### 1. Sign Up Process
- User signs up via `supabase.auth.signUp()`
- Supabase automatically sends verification email
- Email uses template: `supabase/templates/confirmation.html`
- Redirect URL: `${window.location.origin}/verify-email?verified=true`

### 2. Resend Process
- User can resend verification email via `supabase.auth.resend()`
- Uses same template and redirect URL
- Has 60-second cooldown to prevent spam

## Testing Steps

### Test 1: Initial Signup Email
1. **Navigate to**: `/sign-up` or `/auth`
2. **Fill form**:
   - Full Name: "Test User"
   - Email: Use a real email you can access
   - Password: "TestPass123!"
   - Role: Select any role
3. **Submit form**
4. **Expected**:
   - Success toast: "Check your email - We've sent you a verification link"
   - Redirected to `/verify-email`
   - Email arrives within 1-2 minutes
   - Email subject: "Confirm your signup"
   - Email contains verification link

### Test 2: Email Content Verification
**Check email for**:
- ✅ Blinno branding (green/blue gradient header)
- ✅ "Almost there!" heading
- ✅ User's name (if provided)
- ✅ "Verify Email Address" button
- ✅ Verification link (copy/paste option)
- ✅ 24-hour expiration notice
- ✅ Support contact information
- ✅ Link redirects to: `https://www.blinno.app/verify-email?verified=true`

### Test 3: Resend Functionality
1. **On `/verify-email` page**
2. **Click "Resend Verification Email"**
3. **Expected**:
   - Button disabled for 60 seconds (countdown)
   - Success toast: "A new verification link has been sent..."
   - New email arrives
   - Same content as initial email

### Test 4: Email Link Click
1. **Click verification link in email**
2. **Expected**:
   - Redirected to `/verify-email?verified=true`
   - Success message: "Email verified!"
   - Auto-redirect to appropriate dashboard:
     - Sellers → `/onboarding`
     - Buyers → `/buyer`

### Test 5: Already Verified Handling
1. **If email already verified**:
   - Resend button shows "Already Verified" message
   - Auto-redirects after 2 seconds

## Configuration Check

### Supabase Email Settings
The platform relies on Supabase's email configuration. Check:

1. **Supabase Dashboard** → Authentication → Email Templates
   - Custom template should be uploaded: `supabase/templates/confirmation.html`
   - Template uses Go template syntax: `{{ .ConfirmationURL }}`, `{{ .Data.full_name }}`

2. **Email Provider**:
   - Supabase uses its default email service (SendGrid)
   - Or can be configured with custom SMTP
   - Check Supabase Dashboard → Settings → Auth → SMTP Settings

3. **Redirect URLs**:
   - Allowed redirect URLs must include:
     - `https://www.blinno.app/verify-email?verified=true`
     - `http://localhost:5173/verify-email?verified=true` (for development)

## Troubleshooting

### Email Not Received
1. **Check spam/junk folder**
2. **Verify email address is correct**
3. **Check Supabase logs** (Dashboard → Logs → Auth)
4. **Verify SMTP configuration** in Supabase Dashboard
5. **Check rate limits** (Supabase has email rate limits)

### Email Template Not Working
1. **Verify template is uploaded** to Supabase
2. **Check template syntax** (Go template format)
3. **Test with Supabase's template editor**

### Link Not Working
1. **Verify redirect URL** is in allowed list
2. **Check URL format** (should include `?verified=true`)
3. **Test link in incognito window** (to avoid cache issues)

## Manual Test Script

```bash
# 1. Sign up a new user
# Navigate to: https://www.blinno.app/sign-up
# Fill form and submit

# 2. Check email inbox
# Look for email from: noreply@[supabase-project].supabase.co
# Subject: "Confirm your signup"

# 3. Click verification link
# Should redirect to: https://www.blinno.app/verify-email?verified=true

# 4. Test resend
# On verify-email page, click "Resend Verification Email"
# Wait 60 seconds, click again
# Should receive new email
```

## Expected Email Template

The email should match the template in `supabase/templates/confirmation.html`:
- Green/blue gradient header with "BLINNO" logo
- "Almost there!" message
- Verification button
- Link expiration notice (24 hours)
- Support contact info

## Code References

- **Signup**: `src/hooks/useAuth.tsx` - `signUp()` function
- **Resend**: `src/pages/VerifyEmail.tsx` - `handleResend()` function
- **Template**: `supabase/templates/confirmation.html`
- **Redirect**: `src/pages/VerifyEmail.tsx` - `redirectToDashboard()`

## Notes

- The `verification-email` Edge Function exists but is **NOT used** for signup verification
- It's a separate function that could be used for custom verification flows
- Supabase handles verification emails automatically via its built-in system
- The template must be uploaded to Supabase Dashboard to be used

