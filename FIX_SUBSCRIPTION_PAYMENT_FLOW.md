# Fix Subscription Payment Flow

## Problem
When users clicked "Subscribe", the subscription was activated immediately without waiting for payment confirmation. The system was not routing through the ClickPesa checkout process properly.

## Root Cause
The onboarding flow was calling `handleComplete()` immediately after payment initiation, creating the subscription record before payment was confirmed. ClickPesa USSD-PUSH payments require user approval on their phone, which takes time.

## Solution
Implemented proper payment confirmation flow similar to the checkout process:

### Changes Made

1. **Payment Status Tracking**
   - Added `paymentReference` state to store transaction ID
   - Added `paymentStatus` state: `"pending" | "completed" | "failed" | null`
   - Added `pollCount` to track polling attempts

2. **Payment Initiation Flow**
   - Initiates payment via ClickPesa
   - Stores payment reference/transaction ID
   - Sets status to "pending"
   - **Does NOT** create subscription immediately
   - Shows waiting UI to user

3. **Payment Status Polling**
   - Polls ClickPesa API every 5 seconds
   - Checks payment status up to 24 times (2 minutes total)
   - Only creates subscription when payment status is "COMPLETED"
   - Handles payment failures and timeouts

4. **User Interface Updates**
   - Shows "Waiting for Payment" state with spinner
   - Displays phone number and instructions
   - Shows polling progress
   - Displays payment failure state with retry option
   - Disables button during payment processing

## New Payment Flow

### Subscription Plans:
1. User clicks "Pay & Subscribe"
2. Payment initiated via ClickPesa
3. **Payment reference stored, status set to "pending"**
4. User sees "Waiting for Payment" screen
5. User approves payment on phone (M-Pesa prompt)
6. System polls for payment status every 5 seconds
7. When payment confirmed → Create subscription
8. Redirect to seller dashboard

### Percentage Plans:
- No payment required
- Subscription created immediately
- Redirect to seller dashboard

## Code Changes

### State Management
```typescript
const [paymentReference, setPaymentReference] = useState<string | null>(null);
const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed" | null>(null);
const [pollCount, setPollCount] = useState(0);
```

### Payment Initiation
- Stores transaction ID in `paymentReference`
- Sets status to "pending"
- Does NOT call `handleComplete()` immediately

### Payment Status Checking
- Uses `check-status` action in edge function
- Polls every 5 seconds
- Creates subscription only when payment is "COMPLETED"
- Handles failures and timeouts

### UI States
- **Pending**: Shows spinner, instructions, polling progress
- **Failed**: Shows error message and retry button
- **Completed**: Automatically proceeds to subscription creation

## Testing

### Test Scenario 1: Successful Payment
1. Select subscription plan
2. Enter phone number
3. Click "Pay & Subscribe"
4. ✅ See "Waiting for Payment" screen
5. Approve payment on phone
6. ✅ Payment confirmed automatically
7. ✅ Subscription created
8. ✅ Redirected to dashboard

### Test Scenario 2: Payment Failure
1. Select subscription plan
2. Enter phone number
3. Click "Pay & Subscribe"
4. ✅ See "Waiting for Payment" screen
5. Reject/cancel payment on phone
6. ✅ See "Payment Failed" message
7. ✅ Can retry payment

### Test Scenario 3: Payment Timeout
1. Select subscription plan
2. Enter phone number
3. Click "Pay & Subscribe"
4. ✅ See "Waiting for Payment" screen
5. Don't approve payment (wait 2 minutes)
6. ✅ See "Payment timeout" message
7. ✅ Can retry payment

### Test Scenario 4: Percentage Plan
1. Select percentage plan
2. Click "Get Started"
3. ✅ Subscription created immediately (no payment)
4. ✅ Redirected to dashboard

## Edge Function Integration

The edge function supports:
- `action: "initiate"` - Starts payment, returns transaction ID
- `action: "check-status"` - Checks payment status by transaction ID

Payment status values:
- `COMPLETED` or `PAYMENT_RECEIVED` → Create subscription
- `FAILED`, `CANCELLED`, or `PAYMENT_FAILED` → Show error
- Other statuses → Continue polling

## Benefits

✅ **Proper Payment Flow**: Users must approve payment before subscription activates
✅ **Better UX**: Clear feedback on payment status
✅ **Error Handling**: Handles failures, timeouts, and cancellations
✅ **Security**: No subscription without confirmed payment
✅ **Consistency**: Matches checkout payment flow

## Summary

The subscription payment flow now:
1. ✅ Initiates payment correctly
2. ✅ Waits for user approval on phone
3. ✅ Polls for payment confirmation
4. ✅ Only creates subscription after payment confirmed
5. ✅ Handles all error cases
6. ✅ Provides clear user feedback

The system now properly routes through ClickPesa checkout before activating any subscription.

