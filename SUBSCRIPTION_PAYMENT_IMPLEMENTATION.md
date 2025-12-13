# Subscription Payment Processing Implementation

## Overview
This document describes the implementation of payment processing for subscription plan changes. Sellers can now upgrade their subscription plans and pay for upgrades using ClickPesa (mobile money) or Flutterwave (hosted checkout with multiple payment methods).

## Components Implemented

### 1. Database Migration
**File**: `supabase/migrations/20250120000003_add_subscription_id_to_payments.sql`

- Added `subscription_id` column to `payment_transactions` table
- Links payment transactions to subscription upgrades/downgrades
- Includes index for faster lookups
- Applied successfully via MCP

### 2. Payment Dialog Component
**File**: `src/components/seller/SubscriptionPaymentDialog.tsx`

A new dialog component that allows sellers to:
- Choose between mobile money (ClickPesa) or hosted checkout (Flutterwave)
- Enter phone number and select mobile money network for mobile payments
- Initiate payment for subscription upgrades
- Automatically update subscription plan when payment is initiated

**Features**:
- Two payment methods: Mobile Money (ClickPesa) and Hosted Checkout (Flutterwave)
- Phone number validation and formatting
- Network selection for mobile money
- Payment transaction creation with subscription_id
- Subscription plan update before payment (webhook activates it)

### 3. Subscription Management Integration
**File**: `src/components/seller/SubscriptionManagement.tsx`

Updated to:
- Show payment dialog when upgrade requires payment
- Handle payment flow for subscription upgrades
- Update subscription status after payment initiation
- Refresh subscription data after payment

**Payment Flow**:
1. User selects a new plan that requires payment
2. Payment dialog opens with amount and plan details
3. User selects payment method and enters details
4. Payment transaction is created with subscription_id
5. Subscription plan is updated to new plan (status: pending)
6. Payment is initiated via ClickPesa or Flutterwave
7. Webhook confirms payment and activates subscription

### 4. Payment Callback Page
**File**: `src/pages/seller/SubscriptionPaymentCallback.tsx`

Handles redirects from Flutterwave hosted checkout:
- Verifies payment status
- Shows success/failure/cancelled states
- Redirects to subscription settings after success
- Provides retry options on failure

**Route**: `/seller/subscription/payment-callback`

### 5. Webhook Updates

#### ClickPesa Webhook
**File**: `supabase/functions/clickpesa-webhook/index.ts`

Updated to:
- Check for `subscription_id` in payment transactions
- Update subscription status to "active" when payment completes
- Set `expires_at` to 30 days from payment date
- Store payment reference in subscription
- Handle failed payments gracefully

#### Flutterwave Webhook
**File**: `supabase/functions/flutterwave-webhook/index.ts`

Updated to:
- Check for `subscription_id` in payment transactions
- Update subscription status to "active" when payment completes
- Set `expires_at` to 30 days from payment date
- Store payment reference in subscription
- Handle failed payments gracefully

### 6. Payment Function Updates

#### ClickPesa Payment Function
**File**: `supabase/functions/clickpesa-payment/index.ts`

Updated to:
- Accept `subscription_id` in payment request payload
- Store `subscription_id` in payment transaction

#### Flutterwave Payment Function
**File**: `supabase/functions/flutterwave-payment/index.ts`

Updated to:
- Accept `subscription_id` in payment request payload (for mobile money)
- Extract `subscription_id` from metadata for hosted checkout
- Store `subscription_id` in payment transaction

## Payment Flow

### Mobile Money (ClickPesa) Flow:
1. User selects plan upgrade requiring payment
2. Payment dialog opens
3. User enters phone number and selects network
4. Payment transaction created with subscription_id
5. Subscription plan updated (status: pending)
6. ClickPesa payment initiated
7. User approves payment on phone
8. ClickPesa webhook confirms payment
9. Subscription activated (status: active, expires_at set)

### Hosted Checkout (Flutterwave) Flow:
1. User selects plan upgrade requiring payment
2. Payment dialog opens
3. User clicks "Continue to Payment"
4. Payment transaction created with subscription_id
5. Subscription plan updated (status: pending)
6. User redirected to Flutterwave checkout
7. User completes payment (card, mobile money, etc.)
8. Flutterwave redirects to callback page
9. Callback page verifies payment status
10. Flutterwave webhook confirms payment
11. Subscription activated (status: active, expires_at set)

## Key Features

1. **Automatic Subscription Activation**: Webhooks automatically activate subscriptions when payment is confirmed
2. **Payment Reference Tracking**: Payment references are stored in subscriptions for audit trails
3. **Graceful Failure Handling**: Failed payments keep the current subscription plan
4. **Multiple Payment Methods**: Support for both mobile money and card payments
5. **Real-time Status Updates**: Subscription status updates immediately after payment confirmation

## Testing Checklist

- [ ] Test mobile money payment flow (ClickPesa)
- [ ] Test hosted checkout flow (Flutterwave)
- [ ] Verify subscription activation after successful payment
- [ ] Verify subscription remains unchanged after failed payment
- [ ] Test payment callback page redirects
- [ ] Verify webhook processing for subscription payments
- [ ] Test upgrade from percentage to subscription plan
- [ ] Test upgrade within subscription plans (starter → professional → enterprise)

## Notes

- Subscription upgrades require immediate payment
- Downgrades take effect at the next billing cycle (no payment required)
- Switching from subscription to percentage plan is immediate (no payment required)
- Payment transactions are linked to subscriptions via `subscription_id` column
- Webhooks handle subscription activation automatically
- Payment references are stored for audit and tracking purposes

