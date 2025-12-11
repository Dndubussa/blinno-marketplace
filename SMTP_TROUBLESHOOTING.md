# SMTP Configuration Troubleshooting

## Current Status
SMTP is configured, but still getting `"535 API key not found"` error.

## Most Likely Issues

### 1. API Key Format Issue
**Problem**: The API key might have:
- Extra spaces before/after
- Hidden characters from copy/paste
- Truncated (not the full key)

**Solution**:
1. Go to Resend Dashboard → **API Keys**
2. Copy the **full** API key (starts with `re_`)
3. In Supabase → **Authentication** → **SMTP Settings**
4. **Delete** the entire password field
5. **Paste** the API key fresh (no spaces)
6. **Save**

### 2. Username Must Be Exactly "resend"
**Problem**: Username is case-sensitive and must be exactly `resend` (lowercase)

**Verify**:
- ✅ **SMTP User**: `resend` (lowercase, no quotes, no spaces)
- ❌ NOT: `Resend`, `RESEND`, ` resend `, `"resend"`

### 3. Domain Not Verified
**Problem**: If using `noreply@blinno.app` but domain isn't verified in Resend

**Check**:
1. Go to Resend Dashboard → **Domains**
2. Is `blinno.app` listed and verified? (green checkmark)
3. If not verified:
   - **Option A**: Verify the domain (add DNS records)
   - **Option B**: Use `onboarding@resend.dev` temporarily

**Temporary Fix**:
- Change **Sender Email** in Supabase to: `onboarding@resend.dev`
- This works without domain verification
- Test signup to confirm SMTP works
- Then verify domain and switch back

### 4. Port/SSL Mismatch
**Problem**: Port and encryption settings don't match

**Correct Configurations**:
- **Port 465** → Use **SSL** encryption
- **Port 587** → Use **TLS** encryption

**Try**:
- If using port 465, ensure SSL is enabled
- If using port 587, ensure TLS is enabled
- Or try switching ports (465 ↔ 587)

### 5. API Key Expired or Revoked
**Problem**: The API key might be inactive

**Check**:
1. Resend Dashboard → **API Keys**
2. Verify the key shows as **Active**
3. Check if it was recently revoked or expired
4. If needed, create a new API key and update Supabase

---

## Step-by-Step Verification

### Step 1: Verify Resend API Key
```
1. Go to https://resend.com/api-keys
2. Find your active API key
3. Copy the FULL key (starts with re_)
4. Verify it's not expired or revoked
```

### Step 2: Verify Supabase SMTP Settings
Go to Supabase Dashboard → **Authentication** → **SMTP Settings**

**Exact values should be**:
```
SMTP Host: smtp.resend.com
SMTP Port: 465 (or 587)
SMTP User: resend
SMTP Password: [paste full API key here - no spaces]
Sender Email: onboarding@resend.dev (if domain not verified)
           OR noreply@blinno.app (if domain verified)
Sender Name: Blinno
```

### Step 3: Test with Default Sender
**Quick test to isolate the issue**:
1. Change **Sender Email** to: `onboarding@resend.dev`
2. Save settings
3. Try a test signup
4. Check if email sends successfully

**If this works**: The issue is domain verification
**If this fails**: The issue is API key or SMTP configuration

### Step 4: Check Recent Logs
Looking at your logs, I see:
- ✅ **14:56:50** - Signup completed successfully (status 200)
- ✅ **14:57:16** - Email verification successful
- ❌ **14:47:31** - "535 API key not found" error

This suggests it might be **intermittent** or was **recently fixed**.

**Check**:
1. Try a new signup now
2. Check if it works
3. If it works, the issue may have been resolved
4. If it still fails, follow the steps above

---

## Quick Diagnostic Test

**Test SMTP Connection** (if Supabase has a test button):
1. Go to **Authentication** → **SMTP Settings**
2. Look for "Test Connection" or "Send Test Email" button
3. Click it
4. Check for any error messages

**Manual Test** (using curl):
```bash
# Replace YOUR_API_KEY with your actual Resend API key
curl -v --url 'smtp://smtp.resend.com:587' \
  --user 'resend:YOUR_API_KEY' \
  --mail-from 'onboarding@resend.dev' \
  --mail-rcpt 'your-test-email@example.com'
```

---

## Common Mistakes Checklist

- [ ] API key has extra spaces
- [ ] API key is truncated (not full key)
- [ ] Username is not exactly `resend` (lowercase)
- [ ] Using wrong port for encryption type
- [ ] Sender email domain not verified
- [ ] API key expired or revoked
- [ ] Copy/paste introduced hidden characters

---

## If Still Not Working

1. **Create a fresh API key** in Resend
2. **Clear all SMTP fields** in Supabase
3. **Re-enter everything** from scratch
4. **Use `onboarding@resend.dev`** as sender (temporary)
5. **Test signup**
6. **If it works**, then verify domain and switch sender email

---

## Alternative: Check Resend Dashboard

1. Go to Resend Dashboard → **Logs** or **Activity**
2. Check if there are any failed SMTP attempts
3. Look for error messages from Resend's side
4. This can give more specific error details

---

## Next Steps

1. **Try a test signup now** - it might be working (logs show recent success)
2. **If it fails**, verify all settings match exactly
3. **Use `onboarding@resend.dev`** as temporary sender to test
4. **Check Resend dashboard** for any API key or domain issues

