# Platform Cleanup Migration Instructions

## Overview
A migration has been created to clean all tables and storage buckets, resetting the platform to a fresh state while preserving the schema structure.

## Migration File
`supabase/migrations/20250115000003_clean_all_tables_and_buckets.sql`

## What This Migration Does

### 1. Cleans Storage Buckets
- Deletes all files from `product-files` bucket
- Deletes all files from `avatars` bucket
- Deletes all files from `product-images` bucket (if exists)
- Deletes all files from `public-product-images` bucket (if exists)

### 2. Cleans Database Tables
The migration truncates all marketplace data tables in the correct order to respect foreign key constraints:

**Child Tables (referenced by others):**
- `order_items`
- `purchased_products`
- `messages`
- `reviews`
- `seller_earnings`
- `withdrawal_requests`
- `payment_transactions`

**Parent Tables:**
- `orders`
- `products`
- `conversations`

**Other Tables:**
- `seller_subscriptions`
- `analytics_report_schedules`
- `newsletter_subscribers`
- `user_roles`

### 3. Preserved Data
- **auth.users** - User accounts are NOT deleted (authentication data)
- **public.profiles** - User profiles are NOT deleted (can be uncommented if needed)

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
cd "G:\AFRITECH INNOVATIONS\BLINNO V2\the-blinno-market-main"
npx supabase migration up
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250115000003_clean_all_tables_and_buckets.sql`
4. Paste and run the SQL

### Option 3: Using MCP Tool (if configured)
The migration can be applied using the Supabase MCP tool if properly configured.

## Important Notes

⚠️ **WARNING**: This migration will delete ALL data from the specified tables and storage buckets. This action cannot be undone.

✅ **Safe**: The migration preserves:
- Database schema structure
- RLS policies
- Functions and triggers
- Storage bucket configurations
- User accounts and profiles (unless uncommented)

## After Running the Migration

Your platform will be:
- ✅ Empty of all marketplace data
- ✅ Ready for fresh product listings
- ✅ Ready for new orders
- ✅ Ready for new users to sign up
- ✅ Schema and policies intact

## If You Want to Also Clean Profiles

If you want to delete user profiles as well, edit the migration file and uncomment:
```sql
TRUNCATE TABLE public.profiles CASCADE;
```

**Note**: This will delete user profiles but NOT auth.users (authentication accounts). To delete auth users, you'll need to do that separately through the Supabase Auth dashboard.

