# SMTP Configuration Verification Guide

## Quick Verification Checklist

### ✅ Step 1: Access SMTP Settings
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **SMTP Settings**

### ✅ Step 2: Verify Configuration

#### Required Settings for Resend:

```
SMTP Host: smtp.resend.com
SMTP Port: 465 (with SSL) OR 587 (with TLS)
SMTP User: resend
SMTP Password: [Your full Resend API key - starts with re_]
Sender Email: noreply@blinno.app (if domain verified)
           OR onboarding@resend.dev (if domain NOT verified)
Sender Name: Blinno
```

### ✅ Step 3: Common Issues to Check

#### Issue 1: API Key Format
- ❌ **Wrong**: `re_1234567890...` (truncated)
- ❌ **Wrong**: ` re_1234567890... ` (extra spaces)
- ✅ **Correct**: Full API key copied from Resend Dashboard

**Fix**: 
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Copy the **full** API key
3. Delete the password field in Supabase
4. Paste fresh key (no spaces)
5. Save

#### Issue 2: Username Case Sensitivity
- ❌ **Wrong**: `Resend`, `RESEND`, ` resend `
- ✅ **Correct**: `resend` (exactly, lowercase, no spaces)

#### Issue 3: Port/Encryption Mismatch
- ❌ **Wrong**: Port 465 with TLS
- ❌ **Wrong**: Port 587 with SSL
- ✅ **Correct**: Port 465 with SSL
- ✅ **Correct**: Port 587 with TLS

#### Issue 4: Domain Verification
- If using `noreply@blinno.app`:
  - Domain must be verified in Resend Dashboard
  - DNS records must be configured
  - Verification status must show green checkmark

- If domain NOT verified:
  - Use `onboarding@resend.dev` as sender email
  - This works without domain verification

#### Issue 5: Rate Limiting
- Resend has rate limits:
  - Free tier: 3,000 emails/month
  - Pro tier: 50,000 emails/month
- Check Resend Dashboard → Usage for current limits

---

## Testing SMTP Configuration

### Test 1: Signup Test
1. Go to your signup page
2. Create a test account with a real email
3. **Expected**: Email arrives within 5-10 seconds
4. **If fails**: Check Supabase Auth logs for SMTP errors

### Test 2: Resend Test
1. Sign up but don't verify
2. Click "Resend verification email"
3. **Expected**: Email arrives within 5-10 seconds
4. **If fails**: Check error message in UI

### Test 3: Check Resend Dashboard
1. Go to [Resend Dashboard](https://resend.com/emails)
2. Check "Emails" section
3. **Expected**: See sent emails with status "Delivered"
4. **If "Bounced" or "Failed"**: Check error details

---

## Troubleshooting

### Problem: "535 API key not found"
**Causes**:
1. API key is wrong/truncated
2. Username is not exactly `resend`
3. Extra spaces in API key

**Solution**:
1. Delete password field completely
2. Copy fresh API key from Resend
3. Paste into password field (no spaces)
4. Ensure username is exactly `resend` (lowercase)
5. Save and test

### Problem: Emails not arriving
**Causes**:
1. SMTP configuration incorrect
2. Domain not verified (if using custom domain)
3. Rate limit exceeded
4. Email in spam folder

**Solution**:
1. Verify SMTP settings match checklist above
2. Check Resend Dashboard for delivery status
3. Check spam/junk folder
4. Verify domain is verified (if using custom domain)
5. Check rate limits in Resend Dashboard

### Problem: Slow email delivery (1+ seconds)
**Causes**:
1. SMTP connection timeout
2. Network issues
3. Resend API rate limiting

**Solution**:
1. Check network connectivity
2. Verify SMTP port/encryption settings
3. Check Resend Dashboard for API status
4. Consider using edge function with Resend API directly (faster)

### Problem: Intermittent failures
**Causes**:
1. Rate limiting
2. Network timeouts
3. SMTP connection pool exhaustion

**Solution**:
1. Implement retry logic
2. Monitor Resend Dashboard for patterns
3. Check Supabase Auth logs for error patterns
4. Consider upgrading Resend plan if hitting limits

---

## Monitoring

### Check Supabase Auth Logs
1. Go to Supabase Dashboard → Logs → Auth Logs
2. Look for:
   - `user_confirmation_requested` events (should be status 200)
   - Duration times (should be < 500ms, not 1.4+ seconds)
   - Error messages related to SMTP

### Check Resend Dashboard
1. Go to [Resend Dashboard](https://resend.com/emails)
2. Monitor:
   - Delivery rates
   - Bounce rates
   - API usage
   - Error messages

### Set Up Alerts
1. Monitor failure rates
2. Alert if > 5% failure rate
3. Alert if response time > 2 seconds
4. Alert if rate limit approaching

---

## Best Practices

1. **Use Custom Domain**: Verify `blinno.app` in Resend for better deliverability
2. **Monitor Regularly**: Check Resend Dashboard weekly
3. **Set Up Alerts**: Get notified of high failure rates
4. **Test After Changes**: Always test after updating SMTP settings
5. **Keep API Key Secure**: Never commit to git, rotate regularly
6. **Document Configuration**: Keep this guide updated with current settings

---

## Current Configuration Status

Based on logs analysis:
- ✅ Signups are completing (status 200)
- ⚠️ Response times are slow (1.4+ seconds) - indicates SMTP issues
- ⚠️ Some tokens expiring - suggests email delays
- ❓ Need to verify SMTP configuration matches checklist above

**Next Steps**:
1. Verify SMTP settings match this guide exactly
2. Test signup and check email delivery time
3. Monitor Resend Dashboard for delivery status
4. Check Supabase Auth logs for SMTP errors

