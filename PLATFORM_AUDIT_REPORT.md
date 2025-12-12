# Comprehensive Platform Audit Report

## Executive Summary
This audit identifies all locations requiring updates following recent system changes including:
- Multi-profile onboarding system
- Persistent onboarding completion flag
- ClickPesa 3-step API workflow
- Account existence checks
- Post-login navigation
- Sitemap implementation

---

## Critical Issues Found

### 1. Onboarding Flow - NOT USING NEW SYSTEM ⚠️ CRITICAL

**File:** `src/pages/Onboarding.tsx`

**Issue:** The onboarding page still uses old hardcoded steps (1-4) instead of the new multi-profile onboarding system with `StepRenderer`.

**Current State:**
- Uses hardcoded `step === 1`, `step === 2`, etc.
- Has old role selection UI
- Doesn't use `CategorySelectionStep`, `GenericFormStep`, `PricingStep`, `PaymentStep` components
- Doesn't leverage `StepRenderer` component

**Expected State:**
- Should use `useOnboardingStatus` hook to get required steps
- Should use `StepRenderer` to dynamically render steps
- Should support all 12 seller types from `sellerTypes.ts`
- Should respect `onboarding_completed` flag

**Impact:** High - New multi-profile onboarding system is not being used

---

### 2. Pricing Section - Currency Mismatch ⚠️ HIGH

**File:** `src/components/PricingSection.tsx`

**Issue:** Landing page pricing shows USD prices ($9.99, $29.99, $99.99) but onboarding uses TZS (25,000, 75,000, 250,000).

**Current State:**
```typescript
price: "$9.99",  // USD
price: "$29.99", // USD
price: "$99.99", // USD
```

**Expected State:**
```typescript
price: "25,000 TZS",
price: "75,000 TZS",
price: "250,000 TZS",
```

**Impact:** High - Confusing for users, pricing inconsistency

---

### 3. Checkout Payment Status Check - Incorrect API Usage ⚠️ MEDIUM

**File:** `src/pages/Checkout.tsx` (Line 262-268)

**Issue:** Passing `reference` as `transaction_id` in status check, which is incorrect.

**Current Code:**
```typescript
action: "check-status",
reference: paymentReference,
transaction_id: paymentReference, // ❌ Wrong - reference is not transaction_id
```

**Expected:**
- Should use `transaction_id` from the initiate response
- Or let the backend look it up by reference

**Impact:** Medium - Payment status checks may fail

---

### 4. Payment Step Component - Needs Update ⚠️ MEDIUM

**File:** `src/components/onboarding/PaymentStep.tsx`

**Issue:** May need to verify it uses the new 3-step ClickPesa API workflow (validate → initiate → check-status).

**Action Required:** Review and update if needed

---

### 5. Error Messages - Need Review ⚠️ LOW

**Files:** Multiple

**Issue:** Error messages may reference old flows or need updates for new features.

**Action Required:** Review all error messages for:
- Account existence errors
- Payment flow errors
- Onboarding errors

---

## Areas Already Updated ✅

1. ✅ **Seller Dashboard** - Correctly uses `useOnboardingStatus` and redirects properly
2. ✅ **Auth Pages** - Account existence checks implemented
3. ✅ **Post-login Navigation** - Uses `getPostLoginRedirectPath`
4. ✅ **ClickPesa Edge Function** - Updated to 3-step workflow
5. ✅ **Security Alert Function** - CORS fixed
6. ✅ **Sitemap** - Implemented and deployed

---

## Recommended Fix Priority

### Priority 1 (Critical - Must Fix)
1. **Onboarding.tsx** - Migrate to new multi-profile system
2. **PricingSection.tsx** - Update to TZS pricing

### Priority 2 (High - Should Fix)
3. **Checkout.tsx** - Fix payment status check
4. **PaymentStep.tsx** - Verify 3-step API usage

### Priority 3 (Medium - Nice to Have)
5. Review and update error messages
6. Add tooltips for new features
7. Update help documentation

---

## Implementation Plan

### Phase 1: Critical Fixes
1. Refactor `Onboarding.tsx` to use `StepRenderer` and new system
2. Update `PricingSection.tsx` to TZS pricing
3. Fix `Checkout.tsx` payment status check

### Phase 2: Verification
1. Test onboarding flow for all seller types
2. Test payment flow in checkout
3. Verify pricing consistency

### Phase 3: Polish
1. Update error messages
2. Add helpful tooltips
3. Update documentation

---

## Files Requiring Updates

### Must Update:
- `src/pages/Onboarding.tsx` - Complete refactor
- `src/components/PricingSection.tsx` - Currency update
- `src/pages/Checkout.tsx` - Payment status fix

### Should Review:
- `src/components/onboarding/PaymentStep.tsx`
- All error message files
- Help/FAQ pages

### Already Correct:
- `src/pages/seller/Dashboard.tsx`
- `src/pages/Auth.tsx`
- `src/pages/SignIn.tsx`
- `src/pages/SignUp.tsx`
- `supabase/functions/clickpesa-payment/index.ts`

