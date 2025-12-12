# Flutterwave Live Webhook Setup Guide

## Webhook URL

Your Flutterwave webhook endpoint is:

```
https://mzwopjynqugexusmklxt.supabase.co/functions/v1/flutterwave-webhook
```

## Setup Instructions

### Step 1: Log into Flutterwave Dashboard

1. Go to [Flutterwave Dashboard](https://app.flutterwave.com/)
2. Log in with your account credentials

### Step 2: Navigate to Webhook Settings

1. Click on **Settings** in the sidebar
2. Select the **Webhooks** tab
3. Make sure you're in the **Live** environment (not Test)

### Step 3: Configure Webhook

1. **Webhook URL**: Enter the following URL:
   ```
   https://mzwopjynqugexusmklxt.supabase.co/functions/v1/flutterwave-webhook
   ```

2. **Secret Hash**: 
   - Generate a strong, unique secret hash (minimum 32 characters recommended)
   - You can use a password generator or create one like: `blinno-flutterwave-webhook-2024-secret-key`
   - **IMPORTANT**: Save this secret hash - you'll need to add it to your Supabase environment variables

3. **Webhook Events**: Select the following events:
   - ✅ `charge.completed` - When a payment is successfully completed
   - ✅ `charge.failed` - When a payment fails
   - ✅ `charge.pending` - When a payment is pending (optional)

4. **Retry Settings**: 
   - Enable retries: **Yes**
   - Maximum retries: **3** (recommended)

5. Click **Save** to apply the settings

### Step 4: Add Secret Hash to Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Edge Functions** → **Secrets**
4. Add a new secret:
   - **Name**: `FLUTTERWAVE_WEBHOOK_SECRET`
   - **Value**: The secret hash you created in Step 3
5. Click **Save**

### Step 5: Verify Webhook Configuration

1. In Flutterwave Dashboard, go to **Settings** → **Webhooks**
2. You should see your webhook URL listed
3. Test the webhook by making a test payment (if available in your Flutterwave plan)

## Webhook Security

The webhook handler implements HMAC SHA256 signature verification to ensure:
- ✅ Requests are authentic (from Flutterwave)
- ✅ Payloads haven't been tampered with
- ✅ Only authorized webhooks are processed

## Webhook Events Handled

The webhook handler processes the following events:

### `charge.completed`
- Updates transaction status to `completed`
- Confirms the order
- Creates seller earnings
- Sends payment receipt email

### `charge.failed`
- Updates transaction status to `failed`
- Marks order as `payment_failed`
- Logs error message

### `charge.pending`
- Updates transaction status to `pending`
- Continues monitoring payment

## Testing the Webhook

### Option 1: Use Flutterwave Test Mode
1. Switch to **Test** environment in Flutterwave Dashboard
2. Configure a separate webhook URL for testing (same endpoint)
3. Make test payments using Flutterwave test credentials
4. Check Supabase Edge Function logs for webhook events

### Option 2: Use Flutterwave Webhook Testing Tool
1. In Flutterwave Dashboard → **Settings** → **Webhooks**
2. Click on your webhook URL
3. Use the "Test Webhook" feature (if available)
4. Verify the response in Supabase logs

## Monitoring Webhooks

### View Logs in Supabase
1. Go to **Edge Functions** → **flutterwave-webhook**
2. Click on **Logs** tab
3. Monitor incoming webhook requests and responses

### View Logs in Flutterwave
1. Go to **Settings** → **Webhooks**
2. Click on your webhook URL
3. View delivery history and status

## Troubleshooting

### Webhook Not Receiving Events

1. **Check URL**: Verify the webhook URL is correct and accessible
2. **Check Secret**: Ensure `FLUTTERWAVE_WEBHOOK_SECRET` is set in Supabase
3. **Check Events**: Verify the correct events are selected in Flutterwave
4. **Check Logs**: Review Supabase Edge Function logs for errors

### Signature Verification Failing

1. **Verify Secret**: Ensure the secret hash in Supabase matches the one in Flutterwave Dashboard
2. **Check Headers**: Verify Flutterwave is sending the `verifhash` header
3. **Check Logs**: Review signature verification errors in logs

### Webhook Returns 401 Unauthorized

- This usually means signature verification failed
- Check that `FLUTTERWAVE_WEBHOOK_SECRET` matches the secret hash in Flutterwave Dashboard
- Verify the webhook is being called from Flutterwave (not a test tool)

### Webhook Returns 404 Not Found

- Verify the Edge Function is deployed: `flutterwave-webhook`
- Check the URL is correct: `/functions/v1/flutterwave-webhook`
- Ensure the function is active in Supabase Dashboard

## Production Checklist

- [ ] Webhook URL configured in Flutterwave Dashboard (Live mode)
- [ ] Secret hash generated and saved securely
- [ ] `FLUTTERWAVE_WEBHOOK_SECRET` added to Supabase environment variables
- [ ] Correct events selected (`charge.completed`, `charge.failed`)
- [ ] Retry settings configured
- [ ] Webhook tested with a test payment
- [ ] Logs monitored for successful webhook deliveries
- [ ] Error handling verified

## Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Check Flutterwave webhook delivery logs
3. Verify all environment variables are set correctly
4. Contact Flutterwave support if webhook delivery is failing

## Additional Resources

- [Flutterwave Webhook Documentation](https://developer.flutterwave.com/docs/webhooks)
- [Flutterwave Dashboard](https://app.flutterwave.com/)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)

