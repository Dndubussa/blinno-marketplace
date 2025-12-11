# SMTP Configuration Confirmation

## ✅ SMTP Configuration for Resend

### Required Settings in Supabase Dashboard

Go to: **Supabase Dashboard** → **Authentication** → **SMTP Settings**

#### Exact Configuration:
```
SMTP Host: smtp.resend.com
SMTP Port: 465 (with SSL) OR 587 (with TLS)
SMTP User: resend
SMTP Password: [Your full Resend API key - starts with re_]
Sender Email: onboarding@resend.dev (if domain not verified)
           OR noreply@blinno.app (if domain verified)
Sender Name: Blinno
```

---

## ✅ Verification Checklist

### 1. Resend API Key
- [ ] API key exists in Resend Dashboard
- [ ] API key is active (not expired/revoked)
- [ ] Full key copied (starts with `re_`)
- [ ] No extra spaces or characters

### 2. SMTP Host
- [ ] Set to: `smtp.resend.com`
- [ ] No `http://` or `https://` prefix
- [ ] No trailing slash

### 3. SMTP Port
- [ ] Port `465` with SSL enabled
- [ ] OR Port `587` with TLS enabled
- [ ] Port and encryption type match

### 4. SMTP User
- [ ] Exactly: `resend` (lowercase)
- [ ] No quotes, no spaces
- [ ] Case-sensitive (must be lowercase)

### 5. SMTP Password
- [ ] Full Resend API key pasted
- [ ] No spaces before/after
- [ ] Same key used in Edge Functions (RESEND_API_KEY)

### 6. Sender Email
- [ ] If domain verified: `noreply@blinno.app`
- [ ] If domain NOT verified: `onboarding@resend.dev`
- [ ] Email format is correct

### 7. Domain Verification (if using custom domain)
- [ ] `blinno.app` added in Resend Dashboard
- [ ] Domain shows as verified (green checkmark)
- [ ] DNS records configured correctly

---

## ✅ Test SMTP Configuration

### Method 1: Test Signup
1. Go to your signup page
2. Create a test account
3. Check if confirmation email is received
4. Check Supabase Dashboard → **Logs** → **Auth Logs**
5. Should see status 200 (success) not 500 (error)

### Method 2: Check Recent Logs
Looking at your logs:
- ✅ **14:56:50** - Signup successful (status 200)
- ✅ **14:57:16** - Email verification successful
- ❌ **14:47:31** - "535 API key not found" (earlier error)

**Status**: Appears to be working now, but verify configuration is correct.

---

## ✅ Common Issues & Fixes

### Issue: "535 API key not found"
**Causes**:
1. API key in password field is wrong/truncated
2. Username is not exactly `resend` (case-sensitive)
3. Extra spaces in API key
4. API key expired/revoked

**Fix**:
1. Delete password field completely
2. Copy fresh API key from Resend
3. Paste into password field
4. Ensure username is exactly `resend` (lowercase)
5. Save and test

### Issue: Domain not verified
**Symptom**: Works with `onboarding@resend.dev` but not with custom domain

**Fix**:
1. Verify domain in Resend Dashboard
2. Add DNS records as instructed
3. Wait for verification (can take up to 48 hours)
4. Update sender email to use verified domain

---

## ✅ Current Configuration Status

Based on logs:
- **Recent signups**: ✅ Working (status 200)
- **Email verification**: ✅ Working
- **Earlier errors**: ❌ "535 API key not found" (may be resolved)

**Recommendation**: 
1. Verify all settings match exactly as listed above
2. Test a new signup to confirm
3. If error persists, re-enter API key fresh

---

## ✅ Quick Verification Steps

1. **Open Supabase Dashboard** → Authentication → SMTP Settings
2. **Verify each field** matches the configuration above
3. **Check Resend Dashboard** → API Keys (verify key is active)
4. **Test signup** with a new email
5. **Check Auth Logs** for any errors

---

## ✅ Confirmation

If all settings match the configuration above:
- ✅ SMTP is correctly configured
- ✅ Should work for signup confirmation emails
- ✅ Should work for password reset emails

If you're still seeing errors:
- Double-check username is exactly `resend` (lowercase)
- Re-enter API key fresh (no spaces)
- Try using `onboarding@resend.dev` as sender (temporary test)

