# Subscription Management Feature

## Overview

Sellers can now manage their pricing plans directly from the Settings page. This feature allows sellers to view their current plan, upgrade/downgrade, and cancel subscriptions.

## Implementation Details

### Components Created

1. **`src/components/seller/SubscriptionManagement.tsx`**
   - Main subscription management component
   - Displays current plan details
   - Handles plan upgrades/downgrades
   - Manages subscription cancellation

### Features Implemented

✅ **Current Plan Display**
- Shows current subscription plan with all features
- Displays plan pricing and billing cycle
- Shows subscription status (active, cancelled, pending)
- Displays expiration/renewal date

✅ **Plan Comparison & Selection**
- Visual plan comparison cards
- Easy plan selection interface
- Highlights current plan
- Shows popular plans

✅ **Plan Changes**
- **Upgrades**: Requires payment (status set to pending until payment confirmed)
- **Downgrades**: Takes effect at next billing cycle
- **Model Switching**: Can switch between subscription and percentage models
- **Percentage Plans**: Changes take effect immediately

✅ **Subscription Cancellation**
- Cancel subscription with confirmation dialog
- Subscription remains active until end of billing period
- Can reactivate at any time

### Integration Points

#### Settings Page
- Added "Subscription" tab to seller Settings (`src/pages/seller/Settings.tsx`)
- Accessible via `/seller/settings?tab=subscription`

#### Database
- Uses existing `seller_subscriptions` table
- RLS policies allow sellers to view/update their own subscriptions
- Plan format: `subscription_{plan_id}` or `percentage_{plan_id}`

### Available Plans

#### Subscription Plans
- **Starter**: 25,000 TZS/month - 5% transaction fee
- **Professional**: 75,000 TZS/month - 3% transaction fee
- **Enterprise**: 250,000 TZS/month - 1% transaction fee

#### Percentage Plans
- **Basic**: 7% per sale
- **Growth**: 10% per sale
- **Scale**: 15% per sale

## Payment Integration (TODO)

Currently, plan upgrades that require payment set the subscription status to `pending` and show a notification. To complete the payment flow:

1. **Integrate with Payment APIs**
   - Use existing `clickpesa-payment` or `flutterwave-payment` Edge Functions
   - Create payment transaction for plan upgrade
   - Update subscription status to `active` after payment confirmation

2. **Payment Flow**
   ```
   User selects upgrade → 
   Calculate upgrade amount → 
   Initiate payment via Edge Function → 
   Wait for webhook confirmation → 
   Update subscription status to active
   ```

3. **Webhook Integration**
   - Use existing `clickpesa-webhook` or `flutterwave-webhook`
   - Add logic to handle subscription payment confirmations
   - Update `seller_subscriptions` table on successful payment

## Usage

1. Navigate to **Seller Dashboard** → **Settings**
2. Click on **Subscription** tab
3. View current plan details
4. Click **Change Plan** to upgrade/downgrade
5. Click **Cancel Subscription** to cancel (with confirmation)

## Security

- ✅ RLS policies ensure sellers can only manage their own subscriptions
- ✅ All plan changes are logged in the database
- ✅ Payment required for upgrades (prevents unauthorized upgrades)
- ✅ Confirmation dialogs for destructive actions

## Future Enhancements

- [ ] Payment integration with ClickPesa/Flutterwave
- [ ] Billing history view
- [ ] Email notifications for plan changes
- [ ] Prorated billing for mid-cycle upgrades
- [ ] Plan usage statistics (listings used vs. limit)
- [ ] Automatic renewal reminders

## Testing Checklist

- [x] Display current subscription
- [x] View plan features
- [x] Select new plan
- [x] Upgrade plan (sets to pending)
- [x] Downgrade plan (scheduled for next cycle)
- [x] Cancel subscription
- [x] Switch between subscription and percentage models
- [ ] Payment processing (requires payment API integration)
- [ ] Webhook confirmation (requires payment API integration)

---

**Status**: ✅ Core functionality complete, payment integration pending

