# Account Existence Check Implementation

## Overview
This document describes the implementation of account existence validation during sign-up, which prevents duplicate account creation and provides clear, user-friendly error messages with actionable options.

## Implementation Details

### 1. Account Validation Utility (`src/lib/accountValidation.ts`)

Created a utility module that provides structured error handling for account existence checks:

- **`AccountExistenceError` Interface**: Defines structured error information including:
  - Error code (`ACCOUNT_EXISTS`, `ACCOUNT_EXISTS_UNVERIFIED`, `ACCOUNT_EXISTS_VERIFIED`)
  - User-friendly message
  - Available actions (sign in, reset password, resend verification)

- **`parseSignupError()` Function**: Parses Supabase Auth signup errors to detect duplicate account scenarios:
  - Detects various error patterns: "already registered", "email already exists", etc.
  - Distinguishes between verified and unverified accounts
  - Returns structured error information with appropriate actions

### 2. Updated Signup Handlers

#### `src/pages/Auth.tsx`
- Added `accountError` state to track account existence errors
- Updated `handleSignUp()` to:
  - Clear previous errors before attempting signup
  - Parse errors using `parseSignupError()`
  - Set structured error state for display
  - Show appropriate toast notifications
- Added `useEffect` to clear errors when switching views
- Added Alert component with action buttons:
  - **Sign In Instead**: Switches to sign-in view and pre-fills email
  - **Reset Password**: Switches to forgot password view and pre-fills email
  - **Resend Verification Email**: Resends verification email for unverified accounts

#### `src/pages/SignUp.tsx`
- Applied the same improvements as `Auth.tsx`
- Alert component navigates to appropriate routes instead of switching views

### 3. Error Detection Patterns

The system detects duplicate accounts by checking for:
- Error messages containing: "already registered", "user already registered", "email already exists", "already exists"
- Error codes: `user_already_registered`, `email_already_exists`
- Additional context: "not confirmed", "unverified" (for unverified accounts)

### 4. User Experience Flow

#### Scenario 1: Verified Account Exists
1. User attempts to sign up with existing email
2. System detects duplicate account
3. Alert displays: "This email is already registered. Please sign in to continue."
4. Actions available:
   - **Sign In Instead**: Pre-fills email in sign-in form
   - **Reset Password**: Pre-fills email in password reset form

#### Scenario 2: Unverified Account Exists
1. User attempts to sign up with unverified email
2. System detects unverified duplicate
3. Alert displays: "This email is already registered but not verified. Please check your email for the verification link or request a new one."
4. Actions available:
   - **Resend Verification Email**: Sends new verification email

### 5. Backend Validation

The implementation relies on Supabase Auth's built-in duplicate detection:
- Supabase Auth automatically prevents duplicate account creation
- Returns structured errors that we parse and display
- No additional backend checks required (Supabase handles this at the database level)

## Benefits

1. **Prevents Duplicate Accounts**: System blocks duplicate signups before they occur
2. **Clear Error Messages**: Users understand exactly what happened and what they can do
3. **Actionable Options**: Users can immediately take action (sign in, reset password, resend verification)
4. **Better UX**: Reduces user frustration with helpful guidance
5. **Consistent Experience**: Same error handling across all signup entry points

## Testing Checklist

- [ ] Sign up with an email that already exists (verified account)
- [ ] Sign up with an email that already exists (unverified account)
- [ ] Verify "Sign In Instead" button works and pre-fills email
- [ ] Verify "Reset Password" button works and pre-fills email
- [ ] Verify "Resend Verification Email" button works for unverified accounts
- [ ] Verify error clears when switching between signup/signin views
- [ ] Verify error clears when successfully signing up with new email
- [ ] Test on both `Auth.tsx` and `SignUp.tsx` pages

## Files Modified

1. `src/lib/accountValidation.ts` - New utility module
2. `src/pages/Auth.tsx` - Updated signup handler and UI
3. `src/pages/SignUp.tsx` - Updated signup handler and UI

## Future Enhancements

1. **Proactive Email Check**: Add optional email validation before form submission (debounced)
2. **Edge Function**: Create backend endpoint for account existence check (optional, for better security)
3. **Analytics**: Track duplicate signup attempts for insights
4. **Rate Limiting**: Add rate limiting for signup attempts to prevent abuse

