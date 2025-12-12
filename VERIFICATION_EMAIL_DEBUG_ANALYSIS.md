# Verification Email Intermittent Failure - Root Cause Analysis

## Executive Summary

The verification email system has **two separate email sending mechanisms** that are not properly integrated:
1. **Supabase Auth SMTP** (primary) - Used by `supabase.auth.signUp()` and `supabase.auth.resend()`
2. **Custom Edge Function** (`verification-email`) - Exists but is **NOT being called**

The intermittent failures are likely due to **SMTP configuration issues** in Supabase Dashboard, not the edge function.

---

## Current Architecture

### 1. Signup Flow
```
User signs up → supabase.auth.signUp() 
  → Supabase Auth Service
    → SMTP Configuration (Supabase Dashboard)
      → Email sent via SMTP
```

### 2. Resend Flow
```
User clicks resend → supabase.auth.resend()
  → Supabase Auth Service
    → SMTP Configuration (Supabase Dashboard)
      → Email sent via SMTP
```

### 3. Edge Function (NOT USED)
```
verification-email edge function exists
  → Uses Resend API directly
  → NOT called by signup/resend flows
  → Only works if manually invoked
```

---

## Root Causes Identified

### 🔴 **Critical Issue #1: Missing HTTP Response Validation**

**Location**: `supabase/functions/verification-email/index.ts:103-120`

**Problem**: The function doesn't check if Resend API returns an error status code.

```typescript
const res = await fetch("https://api.resend.com/emails", {...});
const emailResponse = await res.json(); // ❌ No status check!
console.log("Verification email sent successfully:", emailResponse);
```

**Impact**: If Resend API returns 400/401/429/500, the function still reports success.

**Evidence**: Function always returns 200 even if Resend fails.

---

### 🔴 **Critical Issue #2: Missing API Key Validation**

**Location**: `supabase/functions/verification-email/index.ts:3`

**Problem**: No validation that `RESEND_API_KEY` exists before using it.

```typescript
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// ❌ No check if undefined/null
```

**Impact**: If API key is missing, requests fail silently or return 401.

---

### 🔴 **Critical Issue #3: SMTP Configuration Issues**

**Location**: Supabase Dashboard → Authentication → SMTP Settings

**Problem**: Based on auth logs, signup requests take **1.4+ seconds** (very slow), suggesting:
- SMTP connection timeouts
- Rate limiting
- Authentication failures
- Network issues

**Evidence from Logs**:
```
"duration":1454254968  // 1.45 seconds for signup
"duration":1603401072  // 1.6 seconds for resend
```

**Common SMTP Issues**:
1. **API Key Format**: Extra spaces, truncated, or expired
2. **Username Case Sensitivity**: Must be exactly `resend` (lowercase)
3. **Port/SSL Mismatch**: Port 465 needs SSL, Port 587 needs TLS
4. **Domain Verification**: `noreply@blinno.app` requires verified domain
5. **Rate Limiting**: Resend has rate limits that may be hit

---

### 🟡 **Issue #4: No Retry Logic**

**Problem**: If SMTP fails, there's no automatic retry mechanism.

**Impact**: Intermittent network issues cause permanent failures.

---

### 🟡 **Issue #5: No Error Logging for SMTP Failures**

**Problem**: Supabase Auth SMTP errors are not logged in a way that's easily accessible.

**Impact**: Difficult to diagnose why emails fail.

---

### 🟡 **Issue #6: Edge Function Not Integrated**

**Problem**: The `verification-email` edge function exists but is never called.

**Impact**: Custom email template and Resend API integration is unused.

---

## Evidence from Logs

### Successful Signups (Status 200)
```
"action":"user_confirmation_requested"
"status":200
"duration":1454254968  // 1.45 seconds - very slow!
```

### Successful Resends (Status 200)
```
"path":"/resend"
"status":200
"duration":1603401072  // 1.6 seconds - very slow!
```

### Expired Tokens
```
"error":"One-time token not found"
"msg":"403: Email link is invalid or has expired"
```

**Analysis**: Tokens are expiring, suggesting emails are delayed or not arriving.

---

## Intermittent Failure Patterns

### Pattern 1: Slow SMTP Response
- **Symptom**: Signup takes 1.4+ seconds
- **Cause**: SMTP connection timeout or slow response
- **Frequency**: Intermittent (network-dependent)

### Pattern 2: Token Expiration
- **Symptom**: "One-time token not found" errors
- **Cause**: Email delayed, user clicks link after 24 hours
- **Frequency**: Occasional

### Pattern 3: Silent Failures
- **Symptom**: No email received, but signup returns success
- **Cause**: SMTP fails but Supabase doesn't report error
- **Frequency**: Unknown (no error logs)

---

## Resolution Steps

### Step 1: Fix Edge Function Error Handling

**File**: `supabase/functions/verification-email/index.ts`

**Changes Needed**:
1. Validate `RESEND_API_KEY` exists
2. Check HTTP response status codes
3. Handle Resend API errors properly
4. Add detailed error logging

---

### Step 2: Verify SMTP Configuration

**Location**: Supabase Dashboard → Authentication → SMTP Settings

**Checklist**:
- [ ] SMTP Host: `smtp.resend.com`
- [ ] SMTP Port: `465` (SSL) or `587` (TLS)
- [ ] SMTP User: `resend` (exactly, lowercase)
- [ ] SMTP Password: Full Resend API key (no spaces)
- [ ] Sender Email: `noreply@blinno.app` (if domain verified) OR `onboarding@resend.dev`
- [ ] Test connection works

---

### Step 3: Add Retry Logic (Optional)

**Option A**: Use Supabase Auth webhooks to retry failed emails
**Option B**: Implement retry in edge function if we switch to it

---

### Step 4: Integrate Edge Function (Optional Enhancement)

**Current**: Supabase Auth uses SMTP directly
**Proposed**: Use edge function for custom email templates

**Requires**:
- Supabase Auth webhook to call edge function
- Or replace `supabase.auth.signUp()` with custom flow

---

### Step 5: Add Monitoring

**Implement**:
1. Log all email send attempts
2. Track success/failure rates
3. Alert on high failure rates
4. Monitor SMTP response times

---

## Immediate Fixes Required

### Fix #1: Improve Edge Function Error Handling

```typescript
// Add API key validation
if (!RESEND_API_KEY) {
  return new Response(
    JSON.stringify({ success: false, error: "RESEND_API_KEY not configured" }),
    { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

// Check HTTP response status
if (!res.ok) {
  const errorData = await res.json();
  console.error("Resend API error:", res.status, errorData);
  return new Response(
    JSON.stringify({ success: false, error: errorData.message || "Failed to send email" }),
    { status: res.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}
```

### Fix #2: Verify SMTP Configuration

1. Go to Supabase Dashboard
2. Navigate to Authentication → SMTP Settings
3. Verify all settings match Resend requirements
4. Test with a signup
5. Check Resend Dashboard for delivery logs

### Fix #3: Add Request Validation

```typescript
// Validate request payload
if (!email || !verificationUrl) {
  return new Response(
    JSON.stringify({ success: false, error: "Missing required fields: email, verificationUrl" }),
    { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}
```

---

## Testing Plan

### Test 1: SMTP Configuration
1. Sign up with test email
2. Check email arrives within 5 seconds
3. Verify email content is correct
4. Check Resend Dashboard for delivery status

### Test 2: Edge Function (if integrated)
1. Call edge function directly
2. Verify error handling works
3. Test with invalid API key
4. Test with missing fields

### Test 3: Rate Limiting
1. Send multiple signup requests rapidly
2. Verify rate limits are handled gracefully
3. Check error messages are clear

---

## Monitoring Recommendations

1. **Track SMTP Response Times**: Alert if > 2 seconds
2. **Monitor Failure Rates**: Alert if > 5% failure rate
3. **Log All Email Events**: Store in database for analysis
4. **Resend Dashboard**: Check delivery logs regularly
5. **Supabase Auth Logs**: Monitor for SMTP errors

---

## Conclusion

**Primary Root Cause**: SMTP configuration issues in Supabase Dashboard causing intermittent failures.

**Secondary Issues**: 
- Edge function has poor error handling (but isn't used)
- No retry logic
- No proper monitoring

**Priority Fixes**:
1. ✅ Verify and fix SMTP configuration
2. ✅ Improve edge function error handling (for future use)
3. ✅ Add request validation
4. ⚠️ Consider integrating edge function for better control

