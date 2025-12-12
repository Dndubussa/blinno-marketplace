# Flutterwave Payment Integration Migration

## Overview
This document outlines the migration from ClickPesa to Flutterwave payment gateway.

## Changes Made

### 1. New Edge Functions
- **`flutterwave-payment`**: Handles payment initiation and status checking
- **`flutterwave-webhook`**: Processes Flutterwave webhook notifications

### 2. Updated Frontend Components
- **`src/pages/Onboarding.tsx`**: Updated to use `flutterwave-payment` instead of `clickpesa-payment`
- **`src/pages/Checkout.tsx`**: Updated to use `flutterwave-payment` instead of `clickpesa-payment`
- **`src/pages/buyer/Payments.tsx`**: Updated to use `flutterwave-payment` for test payments

### 3. Configuration
- **`supabase/config.toml`**: Added configuration for `flutterwave-payment` and `flutterwave-webhook` functions

## Environment Variables Required

Set the following environment variables in your Supabase project:

```bash
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3  # Optional, defaults to production
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret  # Optional, for webhook verification
```

## Flutterwave API Integration

### Payment Initiation
- **Endpoint**: `POST /charges?type=mobile_money_tanzania`
- **Method**: Mobile Money (USSD Push)
- **Supported Networks**: M-Pesa, Tigo Pesa, Airtel Money, Halopesa

### Payment Status Check
- **Endpoint**: `GET /transactions/{transaction_id}/verify`
- **Returns**: Transaction status, amount, currency, and other details

### Webhook Events
- **Event Types**: `charge.completed`, `charge.failed`
- **Webhook URL**: `https://your-project.supabase.co/functions/v1/flutterwave-webhook`

## Network Mapping

| Our Network Name | Flutterwave Network Code |
|----------------|-------------------------|
| MPESA | mpesa |
| TIGOPESA | tigopesa |
| AIRTELMONEY | airtelmoney |
| HALOPESA | halopesa |

## Status Mapping

| Flutterwave Status | Our Status |
|-------------------|-----------|
| successful | completed |
| completed | completed |
| failed | failed |
| cancelled | cancelled |
| pending | pending |

## Testing

1. **Sandbox Environment**: Use Flutterwave's sandbox for testing
   - Set `FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3` (sandbox)
   - Use test credentials from Flutterwave dashboard

2. **Test Payments**: Use test phone numbers provided by Flutterwave

3. **Webhook Testing**: Use Flutterwave's webhook testing tool or ngrok for local testing

## Migration Checklist

- [x] Create Flutterwave payment Edge Function
- [x] Create Flutterwave webhook handler
- [x] Update onboarding payment flow
- [x] Update checkout payment flow
- [x] Update test payment functionality
- [ ] Set environment variables in Supabase
- [ ] Deploy Edge Functions
- [ ] Configure webhook URL in Flutterwave dashboard
- [ ] Test payment flow end-to-end
- [ ] Update documentation

## Notes

- The database field `clickpesa_reference` is kept for backward compatibility but now stores Flutterwave transaction IDs
- Phone number formatting remains the same (255XXXXXXXXX format)
- Payment flow and user experience remain unchanged
- Webhook signature verification should be implemented properly in production

## Flutterwave Documentation
- [Flutterwave API Docs](https://developer.flutterwave.com/docs)
- [Mobile Money Integration](https://developer.flutterwave.com/docs/mobile-money)
- [Webhooks Guide](https://developer.flutterwave.com/docs/webhooks)

