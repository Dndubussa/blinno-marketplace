# Pricing Model Selection During Onboarding - Confirmation

## ✅ CONFIRMED: Sellers Select Pricing Model During Onboarding

### Overview
**YES**, all sellers are required to select a pricing model during the onboarding process. This is a **required step** for all seller types.

---

## Implementation Details

### 1. Pricing Step in Onboarding Flow

The `pricing` step is included in the `requiredSteps` array for **ALL** seller types:

- ✅ **Individual Seller**: `["category", "profile", "pricing", "payment"]`
- ✅ **Business/Store/Shop**: `["category", "business_info", "verification", "pricing", "payment"]`
- ✅ **Artist**: `["category", "portfolio", "profile", "pricing", "payment"]`
- ✅ **Content Creator**: `["category", "content_info", "portfolio", "pricing", "payment"]`
- ✅ **Online Teacher**: `["category", "credentials", "teaching_info", "pricing", "payment"]`
- ✅ **Musician**: `["category", "music_info", "portfolio", "pricing", "payment"]`
- ✅ **Photographer**: `["category", "portfolio", "profile", "pricing", "payment"]`
- ✅ **Writer**: `["category", "writing_info", "portfolio", "pricing", "payment"]`
- ✅ **Restaurant**: `["category", "business_info", "menu_info", "location", "pricing", "payment"]`
- ✅ **Event Organizer**: `["category", "business_info", "event_info", "pricing", "payment"]`
- ✅ **Service Provider**: `["category", "service_info", "profile", "pricing", "payment"]`
- ✅ **Other**: `["category", "profile", "pricing", "payment"]`

**Source**: `src/lib/sellerTypes.ts` - All seller type configurations include `"pricing"` in `requiredSteps`

---

### 2. Pricing Step Configuration

**Step ID**: `pricing`  
**Component**: `PricingStep`  
**Order**: 5 (typically appears after profile/business info and before payment)  
**Required**: Yes (for all seller types)

**Source**: `src/lib/onboardingSteps.ts` - Step configuration at line 496-503

---

### 3. Pricing Models Available

Sellers can choose between **two pricing models**:

#### A. Subscription Model (Monthly Fees)
- **Starter**: 25,000 TZS/month
  - Up to 25 product listings
  - Basic analytics dashboard
  - Standard support
  - 5% transaction fee
  
- **Professional**: 75,000 TZS/month (Popular)
  - Up to 500 product listings
  - Advanced analytics & reports
  - Priority support
  - 3% transaction fee
  - Custom storefront domain
  - Marketing tools included
  - Bulk product upload

- **Enterprise**: 250,000 TZS/month
  - Unlimited product listings
  - Full analytics suite
  - Dedicated account manager
  - 1% transaction fee
  - API access
  - White-label options
  - SLA guarantee

#### B. Percentage Model (Pay Per Sale)
- **Basic**: 7% per sale
  - Up to 50 product listings
  - Basic analytics
  - Community support
  - No monthly fees
  
- **Growth**: 10% per sale (Popular)
  - Up to 200 product listings
  - Advanced analytics
  - Email support
  - Priority placement
  - Marketing tools
  - Promotional features

- **Scale**: 15% per sale
  - Unlimited listings
  - Full analytics suite
  - Priority support
  - Featured placement
  - Custom integrations
  - Dedicated success manager
  - Early access to features

**Source**: `src/components/onboarding/PricingStep.tsx` - Plan definitions

---

### 4. Data Storage

When a seller selects a pricing model and plan, the following data is stored:

```typescript
{
  pricingModel: "subscription" | "percentage",
  plan: "starter" | "professional" | "enterprise" | "basic" | "growth" | "scale"
}
```

**Storage Location**:
- **During Onboarding**: Stored in `OnboardingData` state (`data.pricingModel` and `data.plan`)
- **After Completion**: Stored in `seller_subscriptions` table in the database

**Source**: `src/pages/Onboarding.tsx` - Lines 228-258

---

### 5. Subscription Creation

After pricing selection and payment (if subscription model), a subscription record is created:

**For Subscription Model**:
```typescript
{
  seller_id: user.id,
  plan: "subscription_starter" | "subscription_professional" | "subscription_enterprise",
  price_monthly: 25000 | 75000 | 250000,
  status: "active",
  expires_at: Date (30 days from now),
  payment_reference: paymentReference
}
```

**For Percentage Model**:
```typescript
{
  seller_id: user.id,
  plan: "percentage_basic" | "percentage_growth" | "percentage_scale",
  price_monthly: 0,
  status: "active"
}
```

**Source**: `src/pages/Onboarding.tsx` - Lines 228-258

---

### 6. Payment Flow

1. **Pricing Step**: Seller selects pricing model and plan
2. **Payment Step**: 
   - **Subscription Model**: Requires payment via ClickPesa (mobile money)
   - **Percentage Model**: No payment required (proceeds directly to completion)
3. **Completion**: Subscription record created and onboarding marked complete

**Source**: `src/pages/Onboarding.tsx` - Lines 306-323

---

## User Experience

### Step Flow
1. Seller selects seller type (category step)
2. Seller fills profile/business information
3. **Seller selects pricing model and plan** ← **PRICING STEP**
4. Seller completes payment (if subscription model)
5. Onboarding complete → Redirected to seller dashboard

### UI Components
- **PricingStep Component**: `src/components/onboarding/PricingStep.tsx`
  - Tabs to switch between Subscription and Percentage models
  - Cards displaying each plan with features
  - Visual selection with badges
  - Next/Back navigation buttons

---

## Validation

The pricing step is validated to ensure:
- ✅ `pricingModel` is selected (either "subscription" or "percentage")
- ✅ `plan` is selected (one of the available plans for the selected model)
- ✅ For subscription model, payment must be completed before onboarding completion
- ✅ For percentage model, onboarding can complete immediately after selection

**Source**: `src/pages/Onboarding.tsx` - `handleSellerNext` function

---

## Summary

✅ **CONFIRMED**: All sellers must select a pricing model during onboarding  
✅ **REQUIRED STEP**: Pricing step is mandatory for all seller types  
✅ **TWO MODELS**: Subscription (monthly) or Percentage (per sale)  
✅ **STORED IN DB**: Selection is saved to `seller_subscriptions` table  
✅ **PAYMENT FLOW**: Subscription requires payment; Percentage does not  

---

## Files Referenced

- `src/lib/sellerTypes.ts` - Seller type configurations
- `src/lib/onboardingSteps.ts` - Step definitions
- `src/components/onboarding/PricingStep.tsx` - Pricing UI component
- `src/pages/Onboarding.tsx` - Main onboarding flow logic

