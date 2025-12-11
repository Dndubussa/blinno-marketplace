# Email Template Configuration Guide

This guide will help you configure custom email templates in your Supabase Dashboard.

## Step 1: Access Email Templates in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates** (or go directly to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/templates`)

---

## Configure "Confirm signup" Template (Email Verification)

### Step 1: Find and Edit the Template

1. Find the **"Confirm signup"** template in the list
2. Click on it to edit

### Step 2: Update the Email Subject

Set the subject to:
```
Verify your Blinno account
```

### Step 3: Copy the HTML Template

Copy the entire HTML content from `supabase/templates/confirmation.html` and paste it into the **Content** field of the "Confirm signup" template.

**Important:** The template uses Supabase's Go template variables:
- `{{ .ConfirmationURL }}` - The verification link
- `{{ .Data.full_name }}` - User's full name from signup metadata
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect URL after verification

### Step 4: Save the Template

Click **Save** to apply the changes.

---

## Configure "Reset Password" Template

### Step 1: Find and Edit the Template

1. Find the **"Reset Password"** template in the list
2. Click on it to edit

### Step 2: Update the Email Subject

Set the subject to:
```
Reset Your Blinno Password
```

### Step 3: Copy the HTML Template

Copy the entire HTML content from `supabase/templates/recovery.html` and paste it into the **Content** field of the "Reset Password" template.

### Step 4: Save the Template

Click **Save** to apply the changes.

---

## Testing the Templates

### Test Verification Email

1. Sign up a new user with a test email
2. Check your email inbox for the verification email
3. Verify that the email matches the custom design

### Test Password Reset Email

1. Go to the sign-in page and click "Forgot Password"
2. Enter a test email address
3. Check your email inbox for the password reset email
4. Verify that the email matches the custom design

## Alternative: Using Management API

If you prefer to configure via API, you can use the Supabase Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Update confirmation (signup) email template
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_confirmation": "Verify your Blinno account",
    "mailer_templates_confirmation_content": "<!DOCTYPE html>... [paste HTML from confirmation.html]"
  }'

# Update recovery (password reset) email template
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_recovery": "Reset Your Blinno Password",
    "mailer_templates_recovery_content": "<!DOCTYPE html>... [paste HTML from recovery.html]"
  }'
```

## Template Variables Reference

Supabase provides these template variables:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Full confirmation URL with token |
| `{{ .Token }}` | 6-digit OTP code (alternative to URL) |
| `{{ .TokenHash }}` | Hashed token for custom URL construction |
| `{{ .SiteURL }}` | Your configured site URL |
| `{{ .RedirectTo }}` | Redirect URL passed during signup |
| `{{ .Email }}` | User's email address |
| `{{ .Data }}` | User metadata (e.g., `{{ .Data.full_name }}`) |

## Notes

- The template is automatically used when users sign up via `supabase.auth.signUp()`
- No code changes are needed - Supabase Auth will use this template automatically
- The template supports conditional rendering using Go template syntax
- Make sure your Site URL is configured correctly in **Authentication** → **URL Configuration**

## Troubleshooting

If emails aren't using the custom template:
1. Verify the template was saved in the Dashboard
2. Check that email confirmations are enabled in **Authentication** → **Providers**
3. Ensure you're using a custom SMTP provider (recommended for production)
4. Check the Supabase logs for any email sending errors

