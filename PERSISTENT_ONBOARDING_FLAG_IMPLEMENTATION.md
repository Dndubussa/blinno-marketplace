# Persistent Onboarding Completion Flag Implementation

## Overview
Implemented a persistent onboarding completion flag system that ensures onboarding runs only once per user and never re-triggers unless manually reset or required for versioned updates.

## Key Features

### 1. Persistent Completion Flag
- `onboarding_completed` (BOOLEAN) in `seller_profiles` table
- Once set to `true`, onboarding never re-triggers
- Checked on every login and route access

### 2. Version Support
- `onboarding_version` (INTEGER) tracks which version of onboarding was completed
- `CURRENT_ONBOARDING_VERSION` constant (currently 1)
- Allows forcing re-onboarding for future updates
- Increment version when onboarding requirements change

### 3. Smart Redirect Logic
- **Completed users**: Skip onboarding, redirect directly to dashboard
- **Incomplete users**: Redirect to onboarding
- **Outdated version**: Reset and redirect to onboarding

### 4. Admin Reset Capability
- `resetOnboarding()` function for manual resets
- `checkAndForceVersionUpdate()` for version-based resets
- Tracks reset reason and timestamp

## Implementation Details

### Database Schema

```sql
seller_profiles:
  - onboarding_completed: BOOLEAN (default: false)
  - onboarding_version: INTEGER (default: 1)
  - onboarding_data: JSONB (stores completion data)
```

### Status Check Logic

```typescript
// Onboarding is complete if:
1. onboarding_completed = true
2. onboarding_version >= CURRENT_ONBOARDING_VERSION
3. hasActivePricingPlan = true (for sellers)

// Onboarding should be shown if:
1. User has seller role AND
2. onboarding_completed = false OR
3. onboarding_version < CURRENT_ONBOARDING_VERSION OR
4. No active pricing plan
```

### Completion Flow

1. User completes all required steps
2. `markOnboardingComplete()` is called
3. System verifies all required steps are completed
4. Sets `onboarding_completed = true`
5. Sets `onboarding_version = CURRENT_ONBOARDING_VERSION`
6. Stores completion timestamp and data

### Login Flow

1. User logs in
2. `checkOnboardingStatus()` is called
3. If `onboarding_completed = true` and version is current:
   - **Skip onboarding**
   - Redirect to dashboard
4. If `onboarding_completed = false` or version outdated:
   - Redirect to onboarding

### Route Protection

- **Seller Dashboard**: Checks onboarding status on mount
- **Onboarding Page**: Redirects to dashboard if already completed
- **Auth Redirect**: Checks onboarding before redirecting sellers

## User Scenarios

### Scenario 1: New User Completes Onboarding
1. User signs up as seller
2. Completes all onboarding steps
3. `onboarding_completed = true`, `onboarding_version = 1`
4. On subsequent logins: **Skip onboarding**, go to dashboard

### Scenario 2: Existing User (Already Completed)
1. User logs in
2. System checks: `onboarding_completed = true`, `version = 1`
3. **Onboarding skipped**
4. Redirected directly to seller dashboard

### Scenario 3: Version Update (Future)
1. Onboarding requirements change
2. `CURRENT_ONBOARDING_VERSION` incremented to 2
3. User logs in with `version = 1`
4. System detects outdated version
5. Resets onboarding, redirects to complete new version

### Scenario 4: Admin Reset
1. Admin calls `resetOnboarding(userId, "Manual reset")`
2. Sets `onboarding_completed = false`
3. User logs in, redirected to onboarding

## Functions

### `checkOnboardingStatus(userId)`
- Checks completion flag and version
- Returns comprehensive status object
- Never shows onboarding if flag is true and version is current

### `markOnboardingComplete(userId, sellerType, data)`
- Verifies all required steps are completed
- Sets `onboarding_completed = true`
- Sets `onboarding_version = CURRENT_ONBOARDING_VERSION`
- Stores completion data

### `shouldRedirectToOnboarding(userId)`
- Returns `false` if onboarding is complete with current version
- Returns `true` only if onboarding is incomplete or outdated

### `resetOnboarding(userId, reason)`
- Admin function to reset onboarding
- Sets `onboarding_completed = false`
- Tracks reset reason

### `checkAndForceVersionUpdate(userId)`
- Checks if user's version is outdated
- Automatically resets if version < current
- Used for version-based updates

## Database Function

### `needs_onboarding(user_id, required_version)`
SQL function that checks:
- If seller profile exists
- If `onboarding_completed = true`
- If `onboarding_version >= required_version`

Returns `true` if onboarding is needed, `false` if complete.

## Protection Points

1. **Login Redirect** (`getPostLoginRedirectPath`)
   - Checks onboarding status
   - Skips onboarding if complete

2. **Seller Dashboard** (`SellerDashboard`)
   - Checks on mount
   - Redirects only if incomplete

3. **Onboarding Page** (`Onboarding`)
   - Checks on mount
   - Redirects to dashboard if already complete

4. **Route Guards** (`OnboardingGuard`)
   - Protects routes
   - Enforces completion

## Version Management

### Current Version
```typescript
export const CURRENT_ONBOARDING_VERSION = 1;
```

### Incrementing Version
When onboarding requirements change:
1. Increment `CURRENT_ONBOARDING_VERSION` (e.g., to 2)
2. Users with `version = 1` will be reset
3. They'll complete new onboarding version
4. Their `version` will be updated to 2

### Example Version Update
```typescript
// Before: CURRENT_ONBOARDING_VERSION = 1
// User completes onboarding → version = 1

// After: CURRENT_ONBOARDING_VERSION = 2 (new requirements added)
// User logs in → version 1 < 2 → reset onboarding
// User completes new onboarding → version = 2
```

## Benefits

1. **One-Time Onboarding**: Users never see onboarding twice
2. **Persistent**: Flag survives across sessions and logins
3. **Version-Aware**: Supports future onboarding updates
4. **Admin Control**: Can reset for specific users
5. **Performance**: Single database check, no repeated prompts
6. **User Experience**: Smooth login, no interruptions

## Testing Checklist

- [ ] New user completes onboarding → Flag set to true
- [ ] User logs in again → Onboarding skipped
- [ ] User accesses seller dashboard → No redirect to onboarding
- [ ] User tries to access onboarding page → Redirected to dashboard
- [ ] Version update → Outdated users reset
- [ ] Admin reset → User sees onboarding again
- [ ] Multiple logins → Onboarding never re-triggers

## Files Modified

1. `src/lib/onboardingStatus.ts` - Updated status check and completion logic
2. `src/pages/Onboarding.tsx` - Added completion check on mount
3. `src/pages/seller/Dashboard.tsx` - Updated redirect logic
4. `src/lib/authRedirect.ts` - Updated to respect completion flag
5. `supabase/migrations/20250115000005_add_onboarding_version.sql` - Added version support

## Migration

Run the migration to add version support:
```sql
-- Adds onboarding_version column
-- Creates needs_onboarding() function
-- Adds index for performance
```

## Important Notes

1. **Never re-trigger if flag is true**: The system will NEVER show onboarding if `onboarding_completed = true` and version is current
2. **Version is required**: Always check version, not just completion flag
3. **Admin reset only**: Regular users cannot reset their own onboarding
4. **Version increments**: Only increment when onboarding requirements actually change

