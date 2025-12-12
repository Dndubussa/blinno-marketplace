# Complete Onboarding Flow: Continue Button Sequence

## Overview
This document details the complete sequence of actions initiated when a user clicks the "Continue" button during seller onboarding, from frontend UI updates to backend database operations.

---

## 1. User Clicks "Continue" Button

### Location
- **Component**: `CategorySelectionStep.tsx` (or any step with Continue/Next button)
- **Button**: `<Button onClick={onNext}>Continue</Button>`

### Initial State
```typescript
{
  sellerStepIndex: 0,           // Current step position
  sellerSteps: [...],           // Array of step configurations
  data: {
    sellerType: "business",     // Selected seller type
    // ... other form data
  },
  user: { id: "user-uuid" },    // Authenticated user
}
```

---

## 2. Frontend: Button Click Handler

### Step 1: Event Propagation
```typescript
// CategorySelectionStep.tsx
<Button onClick={onNext}>  // onNext = handleSellerNext from Onboarding.tsx
```

### Step 2: Handler Execution
**Function**: `handleSellerNext()` in `Onboarding.tsx`

**Code Flow**:
```typescript
const handleSellerNext = useCallback(async () => {
  // 1. Get current step configuration
  const currentStep = sellerSteps[sellerStepIndex];
  if (!currentStep) return;

  // 2. Special handling for payment step
  if (currentStep.id === "payment") {
    // ... payment-specific logic
    return;
  }

  // 3. Validate current step
  const validation = validateStep(currentStep.id, data);
  
  // 4. Mark step as completed
  await completeStep(currentStep.id, data);
  
  // 5. Navigate to next step or complete
  if (sellerStepIndex < sellerSteps.length - 1) {
    setSellerStepIndex((prev) => prev + 1);
  } else {
    await handleSellerComplete();
  }
}, [dependencies]);
```

---

## 3. Frontend: Step Validation

### Validation Function
**Location**: `Onboarding.tsx` - `validateStep()`

**Process**:
1. **Get Step Configuration**: Retrieves field definitions from `stepConfigs`
2. **Check Required Fields**: Validates all required fields are filled
3. **Field-Level Validation**: 
   - Text length (min/max)
   - Email format
   - Phone format
   - URL format
   - Number ranges
4. **Step-Level Validation**: Custom validation function if defined

**Validation Result**:
```typescript
{
  valid: boolean,
  errors: string[]  // Array of error messages
}
```

**If Validation Fails**:
- ❌ Toast notification shown: "Validation Error"
- ❌ Error messages displayed
- ❌ User remains on current step
- ❌ No database updates
- ❌ No navigation

**If Validation Passes**:
- ✅ Proceeds to step completion

---

## 4. Frontend: Step Completion Tracking

### Function Call
**Function**: `completeStep(stepId, stepData)` from `useOnboardingStatus` hook

**Process**:
```typescript
// src/hooks/useOnboardingStatus.tsx
const completeStep = async (stepId: string, stepData?: Record<string, any>) => {
  if (!user?.id) return;
  return await markStepCompleted(user.id, stepId, stepData);
};
```

**What Happens**:
1. **Local State Update**: Updates `onboardingStatus` state
2. **Optimistic UI Update**: Progress indicator updates immediately
3. **Backend Call**: Calls `markStepCompleted()` function

---

## 5. Backend: Database Update (Step Completion)

### Function
**Location**: `src/lib/onboardingStatus.ts` - `markStepCompleted()`

### Database Operations

#### Step 1: Fetch Current Seller Profile
```sql
SELECT * FROM seller_profiles 
WHERE user_id = :userId
```

**Purpose**: Get existing onboarding data

#### Step 2: Update Onboarding Data
```typescript
const currentOnboardingData = sellerProfile?.onboarding_data || {};
const completedSteps = currentOnboardingData.completedSteps || [];

// Add step if not already completed
if (!completedSteps.includes(stepId)) {
  completedSteps.push(stepId);
}

const updatedOnboardingData = {
  ...currentOnboardingData,
  completedSteps,
  [stepId]: stepData || {},  // Store step-specific data
};
```

#### Step 3: Upsert Seller Profile
```sql
INSERT INTO seller_profiles (
  user_id,
  onboarding_data,
  onboarding_completed
) VALUES (
  :userId,
  :updatedOnboardingData,
  false  -- Still in progress
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  onboarding_data = :updatedOnboardingData,
  updated_at = NOW()
```

**Database Table**: `seller_profiles`

**Fields Updated**:
- `onboarding_data` (JSONB): Contains all step data and completion status
- `updated_at` (TIMESTAMP): Auto-updated by trigger

**Response**:
- ✅ Returns `true` on success
- ❌ Returns `false` on error (logged to console)

---

## 6. Frontend: Navigation to Next Step

### State Update
```typescript
if (sellerStepIndex < sellerSteps.length - 1) {
  setSellerStepIndex((prev) => prev + 1);  // Move to next step
}
```

### UI Updates (Framer Motion Animations)

#### Exit Animation (Current Step)
```typescript
exit={{ opacity: 0, x: -20 }}  // Fade out and slide left
```

#### Enter Animation (Next Step)
```typescript
initial={{ opacity: 0, x: 20 }}   // Start from right
animate={{ opacity: 1, x: 0 }}    // Fade in and slide to center
```

### Progress Indicator Update
```typescript
// Progress dots update
{sellerSteps.map((_, i) => (
  <div
    className={i <= sellerStepIndex ? "bg-primary" : "bg-muted"}
  />
))}
```

### Step Content Rendering
**Component**: `StepRenderer` dynamically renders the appropriate step component:
- `CategorySelectionStep` (category)
- `GenericFormStep` (profile, business_info, etc.)
- `PricingStep` (pricing)
- `PaymentStep` (payment)

---

## 7. Conditional Branching: Step-Specific Flows

### Flow A: Category Selection Step
**When**: First step (`step.id === "category"`)

**Actions**:
1. ✅ Validation: Seller type must be selected
2. ✅ Step marked complete
3. ✅ `sellerType` stored in `data`
4. ✅ Steps reloaded based on seller type
5. ✅ Navigate to next step (e.g., `profile`, `business_info`)

**Next Step**: Type-specific information step

---

### Flow B: Information Steps (Profile, Business Info, etc.)
**When**: Middle steps (profile, business_info, portfolio, etc.)

**Actions**:
1. ✅ Validation: All required fields filled
2. ✅ Step data stored in `onboarding_data[stepId]`
3. ✅ Step marked complete
4. ✅ Navigate to next step

**Example Data Stored**:
```json
{
  "profile": {
    "businessName": "My Business",
    "businessDescription": "...",
    "phoneNumber": "+255..."
  }
}
```

---

### Flow C: Pricing Step
**When**: `step.id === "pricing"`

**Actions**:
1. ✅ Validation: Pricing model and plan selected
2. ✅ Data stored:
   ```json
   {
     "pricingModel": "subscription" | "percentage",
     "plan": "starter" | "professional" | "enterprise" | "basic" | "growth" | "scale"
   }
   ```
3. ✅ Step marked complete
4. ✅ Navigate to payment step

**Next Step**: Payment step

---

### Flow D: Payment Step (Subscription Plans)
**When**: `step.id === "payment"` AND `pricingModel === "subscription"`

**Special Handling**:
- ❌ `handleSellerNext()` does NOT proceed automatically
- ✅ Payment must be initiated via "Process Payment" button
- ✅ Payment step has its own handler: `handlePayment()`

**Payment Initiation Flow**:

#### Step 1: Validation
```typescript
if (!data.phoneNumber) {
  toast.error("Phone number required");
  return;
}
if (!data.paymentNetwork) {
  toast.error("Payment method required");
  return;
}
```

#### Step 2: Calculate Price
```typescript
const subscriptionPrices = {
  starter: 25000,
  professional: 75000,
  enterprise: 250000,
};
const planPrice = subscriptionPrices[data.plan] || 0;
```

#### Step 3: Generate Reference
```typescript
const reference = `SUB-${user.id.slice(0, 8)}-${Date.now()}`;
```

#### Step 4: Call ClickPesa API
**Edge Function**: `clickpesa-payment`
**Action**: `"initiate"`

```typescript
const { data: paymentData, error } = await supabase.functions.invoke(
  "clickpesa-payment",
  {
    body: {
      action: "initiate",
      amount: planPrice,
      currency: "TZS",
      phone_number: data.phoneNumber,
      network: data.paymentNetwork,
      reference: reference,
      description: `Blinno ${selectedPlan} Plan Subscription`,
    },
  }
);
```

#### Step 5: Payment Status Management
**State Updates**:
```typescript
setPaymentReference(transactionId);
setPaymentStatus("pending");
setIsProcessingPayment(false);
```

**UI Updates**:
- ✅ Toast: "Payment initiated - Check your phone"
- ✅ Loading indicator shown
- ✅ Payment status card displayed
- ✅ "Process Payment" button disabled

#### Step 6: Payment Polling
**Function**: `checkPaymentStatus()` (called via `useEffect`)

**Polling Logic**:
```typescript
// Poll every 5 seconds
const interval = setInterval(async () => {
  const { data: statusData } = await supabase.functions.invoke(
    "clickpesa-payment",
    {
      body: {
        action: "check-status",
        reference: paymentReference,
      },
    }
  );

  if (statusData?.status === "completed") {
    setPaymentStatus("completed");
    clearInterval(interval);
    // Trigger onboarding completion
    await handleSellerComplete();
  } else if (statusData?.status === "failed") {
    setPaymentStatus("failed");
    clearInterval(interval);
  }
  
  pollCountRef.current++;
  if (pollCountRef.current >= 24) {  // 2 minutes max
    clearInterval(interval);
    setPaymentStatus("failed");
  }
}, 5000);
```

**Backend: ClickPesa Payment Status Check**
- **Edge Function**: `clickpesa-payment`
- **Action**: `"check-status"`
- **API Call**: ClickPesa `/third-parties/transactions/{transaction_id}`
- **Response**: `{ status: "pending" | "completed" | "failed" }`

**On Payment Success**:
- ✅ `paymentStatus` set to `"completed"`
- ✅ Polling stops
- ✅ `handleSellerComplete()` called automatically

---

### Flow E: Payment Step (Percentage Plans)
**When**: `step.id === "payment"` AND `pricingModel === "percentage"`

**Special Handling**:
- ✅ No payment required
- ✅ Shows informational message
- ✅ "Complete Setup" button available
- ✅ Clicking button calls `onComplete()` → `handleSellerNext()`
- ✅ Immediately proceeds to `handleSellerComplete()`

**Code Path**:
```typescript
if (currentStep.id === "payment") {
  if (data.pricingModel === "percentage") {
    await completeStep(currentStep.id, data);
    await handleSellerComplete();  // Direct to completion
  }
  return;
}
```

---

## 8. Final Completion: `handleSellerComplete()`

### Trigger Conditions
1. ✅ All required steps completed
2. ✅ Payment completed (for subscription plans) OR percentage plan selected
3. ✅ Last step reached OR payment step completed

### Complete Flow

#### Step 1: Set Loading State
```typescript
setIsSubmitting(true);
```

#### Step 2: Add Seller Role
**Function**: `becomeSeller()` from `useAuth` hook

**Backend Operation**:
```sql
INSERT INTO user_roles (user_id, role)
VALUES (:userId, 'seller')
ON CONFLICT DO NOTHING
```

**Database Table**: `user_roles`

**Result**:
- ✅ User now has "seller" role
- ✅ Can access seller dashboard
- ✅ Seller features enabled

---

#### Step 3: Create Subscription Record

**Conditional Branching**:

##### Branch A: Subscription Plan
**When**: `pricingModel === "subscription"` AND `paymentStatus === "completed"`

**Database Operation**:
```sql
INSERT INTO seller_subscriptions (
  seller_id,
  plan,
  price_monthly,
  status,
  expires_at,
  payment_reference
) VALUES (
  :userId,
  'subscription_professional',  -- e.g., subscription_starter
  :planPrice,                    -- 25000, 75000, or 250000
  'active',
  :expiresAt,                    -- 30 days from now
  :paymentReference
)
```

**Fields**:
- `plan`: `"subscription_starter"` | `"subscription_professional"` | `"subscription_enterprise"`
- `price_monthly`: `25000` | `75000` | `250000` (TZS)
- `status`: `"active"`
- `expires_at`: Current time + 30 days
- `payment_reference`: Transaction reference from ClickPesa

##### Branch B: Percentage Plan
**When**: `pricingModel === "percentage"`

**Database Operation**:
```sql
INSERT INTO seller_subscriptions (
  seller_id,
  plan,
  price_monthly,
  status
) VALUES (
  :userId,
  'percentage_growth',  -- e.g., percentage_basic
  0,                     -- No monthly fee
  'active'
)
```

**Fields**:
- `plan`: `"percentage_basic"` | `"percentage_growth"` | `"percentage_scale"`
- `price_monthly`: `0` (no monthly fee)
- `status`: `"active"`
- `expires_at`: `NULL` (no expiration)

**Database Table**: `seller_subscriptions`

---

#### Step 4: Mark Onboarding Complete

**Function**: `completeOnboarding(sellerType, onboardingData)`

**Backend Operations**:

##### Step 4a: Verify All Steps Completed
```typescript
const steps = getOrderedSteps(sellerType, false);
const requiredStepIds = steps.map((s) => s.id);
const completedSteps = onboardingData.completedSteps || [];

const allStepsCompleted = requiredStepIds.every((stepId) => 
  completedSteps.includes(stepId)
);
```

**If Not All Steps Completed**:
- ❌ Returns `false`
- ❌ Logs warning
- ❌ Onboarding not marked complete

**If All Steps Completed**:
- ✅ Proceeds to database update

##### Step 4b: Update Seller Profile
```sql
UPDATE seller_profiles
SET 
  seller_type = :sellerType,
  onboarding_completed = true,           -- Persistent flag
  onboarding_version = 1,                -- Current version
  onboarding_data = :onboardingData,    -- Complete data
  category_specific_data = :categoryData,
  updated_at = NOW()
WHERE user_id = :userId
```

**Fields Updated**:
- `seller_type`: Selected seller type (e.g., "business")
- `onboarding_completed`: `true` (prevents re-triggering)
- `onboarding_version`: `1` (for future updates)
- `onboarding_data`: Complete onboarding data with:
  ```json
  {
    "completedSteps": ["category", "profile", "pricing", "payment"],
    "category": { "sellerType": "business" },
    "profile": { "businessName": "...", ... },
    "pricing": { "pricingModel": "subscription", "plan": "professional" },
    "payment": { "phoneNumber": "...", "paymentNetwork": "MPESA" },
    "completedAt": "2024-01-15T10:30:00Z",
    "version": 1
  }
  ```
- `category_specific_data`: Type-specific data (if any)

**Database Table**: `seller_profiles`

**Result**:
- ✅ Onboarding marked complete
- ✅ User will skip onboarding on future logins
- ✅ Version tracked for future updates

---

#### Step 5: Success Notification
```typescript
toast({
  title: "Welcome to Blinno!",
  description: "Your seller account is ready. Start listing your products!",
});
```

**UI Feedback**:
- ✅ Success toast displayed
- ✅ User sees confirmation message

---

#### Step 6: Navigation to Seller Dashboard
```typescript
navigate("/seller");
```

**Route**: `/seller`

**What Happens**:
1. **Route Guard Check**: `OnboardingGuard` checks onboarding status
2. **Onboarding Status**: `onboarding_completed === true` → ✅ Access granted
3. **Dashboard Loads**: Seller dashboard components render
4. **Optional Tour**: First-time sellers may see onboarding tour

---

## 9. Error Handling

### Validation Errors
**When**: Required fields missing or invalid

**Actions**:
- ❌ Toast notification: "Validation Error"
- ❌ Error messages displayed
- ❌ User remains on current step
- ❌ No database updates

### Database Errors
**When**: Database operation fails

**Actions**:
- ❌ Error logged to console
- ❌ Toast notification: "Error" with message
- ❌ User can retry
- ❌ Partial data may be saved

### Payment Errors
**When**: Payment initiation or processing fails

**Actions**:
- ❌ Toast notification: "Payment failed"
- ❌ Error message displayed
- ❌ Payment status set to `"failed"`
- ❌ User can retry payment
- ❌ Onboarding remains incomplete

### Network Errors
**When**: API call fails

**Actions**:
- ❌ Error logged
- ❌ Toast notification with error message
- ❌ User can retry
- ❌ State preserved

---

## 10. Complete Sequence Diagram

```
User Clicks Continue
    ↓
handleSellerNext() called
    ↓
Validate Current Step
    ├─ Invalid → Show Error → Stop
    └─ Valid → Continue
    ↓
completeStep() called
    ↓
markStepCompleted() (Backend)
    ├─ Fetch seller_profiles
    ├─ Update onboarding_data
    └─ Upsert seller_profiles
    ↓
Check if Last Step
    ├─ Not Last → Increment sellerStepIndex → Render Next Step
    └─ Last → handleSellerComplete()
        ↓
        becomeSeller() → Insert user_roles
        ↓
        Create Subscription → Insert seller_subscriptions
        ↓
        completeOnboarding() → Update seller_profiles
            ├─ Verify all steps completed
            ├─ Set onboarding_completed = true
            ├─ Set onboarding_version = 1
            └─ Store complete onboarding_data
        ↓
        Show Success Toast
        ↓
        navigate("/seller")
        ↓
        Dashboard Loads
```

---

## 11. State Management Throughout Flow

### React State Variables
```typescript
// Onboarding.tsx
const [sellerStepIndex, setSellerStepIndex] = useState(0);
const [sellerSteps, setSellerSteps] = useState<StepConfig[]>([]);
const [data, setData] = useState<OnboardingData>({...});
const [isSubmitting, setIsSubmitting] = useState(false);
const [paymentStatus, setPaymentStatus] = useState<...>(null);
const [paymentReference, setPaymentReference] = useState<string | null>(null);
const [isProcessingPayment, setIsProcessingPayment] = useState(false);
```

### Zustand/Context State
```typescript
// useOnboardingStatus hook
const { status, loading, completeStep, completeOnboarding } = useOnboardingStatus();
```

### Database State
```typescript
// seller_profiles table
{
  onboarding_data: {
    completedSteps: string[],
    [stepId]: stepData
  },
  onboarding_completed: boolean,
  onboarding_version: number
}
```

---

## 12. Performance Optimizations

### Optimistic Updates
- ✅ Progress indicator updates immediately
- ✅ Step completion tracked locally before backend confirmation
- ✅ Smooth animations without waiting for API

### Debouncing
- ✅ Payment status polling: 5-second intervals
- ✅ Maximum polling duration: 2 minutes (24 attempts)

### Caching
- ✅ Step configurations cached in component state
- ✅ Seller type configuration loaded once

---

## 13. Security Considerations

### Authentication
- ✅ All operations require authenticated user
- ✅ User ID verified on every backend call

### Authorization
- ✅ RLS policies enforce user can only update their own profile
- ✅ Seller role assignment verified

### Data Validation
- ✅ Frontend validation for UX
- ✅ Backend validation for security
- ✅ SQL injection prevention via parameterized queries

---

## 14. Summary: Complete Flow by Step Type

| Step Type | Validation | Database Update | Next Action |
|-----------|-----------|-----------------|-------------|
| **Category** | Seller type selected | Store `sellerType` | Load type-specific steps → Next step |
| **Profile/Info** | Required fields filled | Store step data | Next step |
| **Pricing** | Model & plan selected | Store pricing data | Payment step |
| **Payment (Subscription)** | Phone & network entered | Payment initiated | Poll status → Complete on success |
| **Payment (Percentage)** | N/A | Step marked complete | Immediate completion |

---

## 15. Testing Scenarios

### Happy Path
1. ✅ User selects seller type → Clicks Continue
2. ✅ Fills all required fields → Clicks Continue
3. ✅ Selects pricing plan → Clicks Continue
4. ✅ Enters payment info → Clicks "Process Payment"
5. ✅ Payment approved → Auto-completes
6. ✅ Redirected to dashboard

### Error Scenarios
1. ❌ Missing required field → Validation error shown
2. ❌ Payment timeout → Failed status, retry option
3. ❌ Payment declined → Failed status, retry option
4. ❌ Network error → Error message, retry option
5. ❌ Database error → Error logged, user notified

---

## Conclusion

The Continue button initiates a comprehensive flow involving:
- **Frontend**: Validation, state management, UI updates, animations
- **Backend**: Database operations, role assignment, subscription creation
- **Conditional Logic**: Different flows based on step type and pricing model
- **Error Handling**: Graceful error messages and retry options
- **Security**: Authentication and authorization checks
- **User Experience**: Smooth animations, progress indicators, clear feedback

The system ensures data integrity, provides clear user feedback, and handles edge cases gracefully throughout the onboarding process.

