# Quick Fix: Resend Click Tracking

## The Problem
Verification email links redirect through Resend's tracking URL instead of going directly to Supabase.

## The Solution
**Disable click tracking in Resend Dashboard:**

1. Go to [Resend Dashboard](https://resend.com/settings)
2. Navigate to **Settings** → **Email Settings**
3. Find **"Click Tracking"** or **"Link Tracking"**
4. **Disable it** (toggle OFF)
5. Save

## Why This Matters
- Supabase verification links are single-use tokens
- Resend's click tracking creates a redirect chain
- This can cause tokens to expire or break verification

## After Fixing
Test by:
1. Creating a new test account
2. Clicking the verification link
3. It should go directly to Supabase (no Resend URL in the middle)

---

**Note**: Supabase Auth uses SMTP, so you must disable tracking in Resend Dashboard. The edge function update I made is for future use only.

