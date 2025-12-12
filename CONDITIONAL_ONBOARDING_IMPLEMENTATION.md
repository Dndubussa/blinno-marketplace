# Conditional Onboarding Logic Implementation

## Overview
Implemented conditional onboarding logic that supports different user states and ensures proper onboarding completion before granting full platform access.

## Implementation Details

### 1. Onboarding Status System (`src/lib/onboardingStatus.ts`)

**Key Functions:**
- `checkOnboardingStatus(userId)` - Checks user's onboarding status and pricing plan
- `getOnboardingStepsForUser(status)` - Determines which steps user needs to complete
- `markStepCompleted(userId, stepId, stepData)` - Marks a step as completed
- `markOnboardingComplete(userId, sellerType, onboardingData)` - Marks entire onboarding as complete
- `shouldRedirectToOnboarding(userId)` - Checks if user should be redirected

**Status Object:**
```typescript
{
  isComplete: boolean;
  sellerType: SellerType | null;
  hasActivePricingPlan: boolean;
  pricingModel: "subscription" | "percentage" | null;
  currentPlan: string | null;
  completedSteps: string[];
  requiredSteps: string[];
  nextStep: string | null;
  shouldShowOnboarding: boolean;
}
```

### 2. Onboarding Status Hook (`src/hooks/useOnboardingStatus.tsx`)

Provides React hook for accessing onboarding status:
- `status` - Current onboarding status
- `loading` - Loading state
- `refresh()` - Reload status
- `completeStep(stepId, stepData)` - Mark step complete
- `completeOnboarding(sellerType, data)` - Mark onboarding complete
- `getSteps()` - Get steps user needs to complete
- `shouldShowOnboarding` - Boolean flag
- `isComplete` - Boolean flag

### 3. Onboarding Guard Component (`src/components/onboarding/OnboardingGuard.tsx`)

Route guard component that:
- Checks onboarding status
- Redirects to onboarding if needed
- Shows loading state while checking
- Prevents access to protected routes until onboarding is complete

### 4. Updated Seller Dashboard (`src/pages/seller/Dashboard.tsx`)

- Uses `useOnboardingStatus` hook
- Automatically redirects to onboarding if incomplete
- Checks onboarding status on mount
- Shows loading state during check

### 5. Updated Onboarding Component (`src/pages/Onboarding.tsx`)

- Integrates with onboarding status system
- Marks steps as completed
- Handles existing users with active pricing plans
- Supports resuming from where user left off
- Marks onboarding complete when finished

### 6. Updated Auth Redirect Logic (`src/lib/authRedirect.ts`)

- `getPostLoginRedirectPath()` now async
- Checks onboarding status for sellers
- Redirects to onboarding if needed
- Otherwise redirects to appropriate dashboard

### 7. Updated Auth Pages (`src/pages/Auth.tsx`, `src/pages/SignIn.tsx`)

- Use async redirect function
- Check onboarding status after login
- Redirect to onboarding if needed

## User Flow Logic

### New Users (No Seller Role)
1. Sign up → Select seller role
2. Start onboarding from step 1 (category selection)
3. Complete all required steps
4. Access granted after completion

### Existing Users (Seller Role, No Active Pricing Plan)
1. Login → Check onboarding status
2. Redirected to onboarding
3. Start from first incomplete step (usually pricing/payment)
4. Complete remaining steps
5. Access granted after completion

### Existing Users (Seller Role, Active Pricing Plan, Incomplete Onboarding)
1. Login → Check onboarding status
2. Redirected to onboarding
3. Resume from first incomplete step
4. Complete remaining steps (may skip pricing/payment if already done)
5. Access granted after completion

### Existing Users (Seller Role, Active Pricing Plan, Complete Onboarding)
1. Login → Check onboarding status
2. Onboarding complete → Access granted
3. Redirected to seller dashboard

## Conditional Step Loading

The system determines which steps to show based on:

1. **User's Seller Type** - Different types have different required steps
2. **Completed Steps** - Steps already completed are skipped
3. **Active Pricing Plan** - If user has active plan, pricing/payment may be skipped
4. **Onboarding Status** - Incomplete onboarding always requires completion

## Step Completion Tracking

- Each step is marked as completed when user progresses
- Completed steps stored in `seller_profiles.onboarding_data.completedSteps`
- System tracks progress across sessions
- Users can resume from where they left off

## Database Integration

- `seller_profiles` table stores:
  - `seller_type` - Type of seller
  - `onboarding_completed` - Boolean flag
  - `onboarding_data` - JSONB with step completion and data
  - `category_specific_data` - Type-specific data

- `seller_subscriptions` table stores:
  - Active pricing plans
  - Used to determine if user needs pricing step

## Route Protection

### Seller Dashboard
- Checks onboarding status on mount
- Redirects to `/onboarding` if incomplete
- Shows loading state during check
- Grants access only when complete

### Onboarding Page
- Accessible to all authenticated users
- Determines starting step based on status
- Tracks progress as user completes steps

## Benefits

1. **Flexible** - Supports different user states
2. **Resumable** - Users can continue where they left off
3. **Enforced** - Cannot access dashboard without completing onboarding
4. **Smart** - Skips completed steps for existing users
5. **Extensible** - Easy to add new steps or requirements

## Testing Checklist

- [ ] New user signup → Full onboarding flow
- [ ] Existing user without pricing plan → Redirected to pricing/payment
- [ ] Existing user with pricing plan but incomplete → Resume from incomplete step
- [ ] Existing user with complete onboarding → Access granted
- [ ] Step completion tracking → Steps marked as completed
- [ ] Resume functionality → Can continue from where left off
- [ ] Route protection → Cannot access dashboard without completion
- [ ] Login redirect → Checks onboarding and redirects appropriately

## Files Modified

1. `src/lib/onboardingStatus.ts` - New status checking system
2. `src/hooks/useOnboardingStatus.tsx` - New React hook
3. `src/components/onboarding/OnboardingGuard.tsx` - New route guard
4. `src/pages/seller/Dashboard.tsx` - Updated to check onboarding
5. `src/pages/Onboarding.tsx` - Updated to use status system
6. `src/lib/authRedirect.ts` - Updated to check onboarding
7. `src/pages/Auth.tsx` - Updated to use async redirect
8. `src/pages/SignIn.tsx` - Updated to use async redirect
9. `src/lib/authOnboardingCheck.ts` - New auth check utility

## Next Steps

1. Test all user flows end-to-end
2. Add step validation before marking complete
3. Add progress indicator showing completed steps
4. Add ability to edit completed steps
5. Add onboarding completion notification

