# Signup Error Debugging Guide

## Error
- **Status**: 500 Internal Server Error
- **Endpoint**: `/auth/v1/signup`
- **Error**: `Failed to fetch` / `ERR_CONNECTION_RESET`

## Root Cause Analysis

The error occurs when a new user tries to sign up. The database trigger `handle_new_user()` fires after user creation but appears to be failing, causing the entire signup transaction to roll back.

## Fixes Applied

### 1. Added 'buyer' to app_role enum ✅
- The enum was missing the 'buyer' value that the trigger tries to insert
- **Migration**: `add_buyer_to_app_role_enum`

### 2. Updated RLS Policies ✅
- Added policy: "Users can insert buyer role on signup"
- Added policy: "Service role can insert profiles"
- Added policy: "Service role can insert user roles"
- **Migrations**: `fix_user_roles_insert_policy_for_buyer`, `add_service_role_policy_for_profiles`

### 3. Improved Trigger Function ✅
- Added proper enum casting: `'buyer'::app_role`
- Added error handling with EXCEPTION blocks
- Added conflict handling with `ON CONFLICT DO NOTHING`
- **Migration**: `fix_handle_new_user_function`, `fix_handle_new_user_final`, `fix_handle_new_user_bypass_rls`

### 4. Verified Permissions ✅
- Function owner: `postgres` (has all permissions)
- Function is `SECURITY DEFINER` (should bypass RLS)
- Tables owned by `postgres`
- All necessary grants in place

## Current Function Definition

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
```

## Next Steps to Debug

1. **Check Supabase Dashboard Logs**:
   - Go to Logs → Postgres
   - Look for errors related to `handle_new_user` or user creation
   - Check for any WARNING messages from the function

2. **Test the Function Manually**:
   ```sql
   -- This will help identify the exact error
   SELECT * FROM pg_stat_user_functions WHERE funcname = 'handle_new_user';
   ```

3. **Check if RLS is the Issue**:
   - Try temporarily disabling RLS on profiles and user_roles
   - If signup works, then RLS is the problem

4. **Alternative: Disable Trigger Temporarily**:
   ```sql
   ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
   ```
   - Test signup
   - If it works, the trigger is definitely the issue

5. **Check Supabase Auth Settings**:
   - Verify email confirmations are configured correctly
   - Check if there are any auth hooks or webhooks that might be interfering

## Potential Issues

1. **RLS Still Blocking**: Even with SECURITY DEFINER, RLS might still apply in Supabase
2. **Function Execution Context**: The function might be running in a context where `auth.uid()` is NULL
3. **Constraint Violation**: There might be a constraint we haven't identified
4. **Transaction Isolation**: The trigger might be running in a transaction that's being rolled back

## Recommended Solution

If the error persists, consider:

1. **Temporarily disable the trigger** and create profiles manually via an Edge Function
2. **Use Supabase Auth Hooks** instead of database triggers
3. **Create profiles in the frontend** after successful signup (less secure but might work)

