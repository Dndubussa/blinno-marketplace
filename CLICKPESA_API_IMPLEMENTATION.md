# ClickPesa API Implementation Guide

## Overview
This document describes the implementation of the ClickPesa Mobile Money Payment API following the official 3-step workflow as documented at [ClickPesa Documentation](https://docs.clickpesa.com/payment-api/mobile-money-payment-api/mobile-money-payment-api-overview).

## API Workflow

According to ClickPesa documentation, the payment process follows these steps:

### Step 1: Validate Payment Details (Preview USSD-PUSH Request)
**Endpoint:** `POST /third-parties/ussd-push/preview`

This endpoint validates payment details such as:
- Mobile Number
- Amount
- Order Reference
- Payment Methods availability

**Action:** `validate`

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke("clickpesa-payment", {
  body: {
    action: "validate",
    amount: 10000,
    currency: "TZS",
    phone_number: "255712345678",
    network: "MPESA",
    reference: "ORDER-12345",
    description: "Payment for order",
  },
});
```

### Step 2: Initiate USSD-PUSH Request
**Endpoint:** `POST /third-parties/ussd-push`

This endpoint sends the USSD-PUSH request to the customer's mobile device. The customer will be prompted to enter their mobile money wallet PIN/password to complete the transaction.

**Action:** `initiate`

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke("clickpesa-payment", {
  body: {
    action: "initiate",
    amount: 10000,
    currency: "TZS",
    phone_number: "255712345678",
    network: "MPESA",
    reference: "ORDER-12345",
    description: "Payment for order",
    order_id: "order-uuid", // Optional
  },
});
```

**Note:** The `initiate` action automatically performs validation first (Step 1) before sending the USSD-PUSH request.

### Step 3: Check Payment Status
**Endpoint:** `GET /third-parties/transactions/{transaction_id}`

This endpoint queries for the payment status using the payment's transaction ID or order reference.

**Action:** `check-status`

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke("clickpesa-payment", {
  body: {
    action: "check-status",
    transaction_id: "clickpesa-transaction-id", // Optional if reference is provided
    reference: "ORDER-12345", // Optional if transaction_id is provided
  },
});
```

## Implementation Details

### Authentication
The function uses ClickPesa API credentials:
- `CLICKPESA_CLIENT_ID` - Client ID from ClickPesa dashboard
- `CLICKPESA_API_KEY` - API Key from ClickPesa dashboard

An authorization token is generated and cached for 1 hour to reduce API calls.

### Supported Networks
- `MPESA` - M-Pesa (Vodacom)
- `TIGOPESA` - Tigo Pesa / Mix By Yas
- `AIRTELMONEY` - Airtel Money
- `HALOPESA` - Halopesa

### Transaction Storage
All payment transactions are stored in the `payment_transactions` table with:
- User ID
- Order ID (if applicable)
- Amount and currency
- Network and phone number
- Reference (order reference)
- ClickPesa reference (transaction ID from ClickPesa)
- Status (pending, processing, completed, failed, cancelled)
- Description

### Status Updates
When checking payment status:
- Transaction status is updated in the database
- If payment is completed, associated order status is updated to "confirmed"

## Frontend Integration

### Onboarding Flow
In `src/pages/Onboarding.tsx`, the payment flow:
1. User selects pricing plan
2. User enters phone number and selects network
3. System calls `initiate` action
4. System polls `check-status` every 5 seconds (up to 24 times = 2 minutes)
5. On completion, subscription is activated

### Checkout Flow
In `src/pages/Checkout.tsx`, the payment flow:
1. User completes shipping information
2. User selects payment method (mobile money)
3. User enters phone number and selects network
4. System calls `initiate` action
5. System polls `check-status` until payment is confirmed or fails

## Error Handling

The function handles various error scenarios:
- Missing credentials (401)
- Missing required fields (400)
- Validation failures (500)
- Payment initiation failures (500)
- Status check failures (500)

All errors are logged and returned with appropriate HTTP status codes.

## CORS Configuration

The function includes proper CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- OPTIONS requests return status 204

## Testing

To test the implementation:

1. **Validate Payment:**
   ```bash
   curl -X POST https://[project-ref].supabase.co/functions/v1/clickpesa-payment \
     -H "Authorization: Bearer [token]" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "validate",
       "amount": 10000,
       "currency": "TZS",
       "phone_number": "255712345678",
       "network": "MPESA",
       "reference": "TEST-001",
       "description": "Test payment"
     }'
   ```

2. **Initiate Payment:**
   ```bash
   curl -X POST https://[project-ref].supabase.co/functions/v1/clickpesa-payment \
     -H "Authorization: Bearer [token]" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "initiate",
       "amount": 10000,
       "currency": "TZS",
       "phone_number": "255712345678",
       "network": "MPESA",
       "reference": "TEST-001",
       "description": "Test payment"
     }'
   ```

3. **Check Status:**
   ```bash
   curl -X POST https://[project-ref].supabase.co/functions/v1/clickpesa-payment \
     -H "Authorization: Bearer [token]" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "check-status",
       "transaction_id": "clickpesa-transaction-id",
       "reference": "TEST-001"
     }'
   ```

## References

- [ClickPesa Mobile Money Payment API Overview](https://docs.clickpesa.com/payment-api/mobile-money-payment-api/mobile-money-payment-api-overview)
- ClickPesa API Documentation: https://docs.clickpesa.com

