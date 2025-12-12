-- Clean all tables and storage buckets to reset the platform
-- This migration deletes all data but preserves the schema structure

-- ============================================
-- PART 1: Clean Storage Buckets
-- ============================================

-- Delete all files from all known storage buckets
-- Using IF EXISTS pattern to handle buckets that may not exist
DO $$
BEGIN
  -- Delete all files from product-files bucket
  DELETE FROM storage.objects WHERE bucket_id = 'product-files';
  
  -- Delete all files from avatars bucket
  DELETE FROM storage.objects WHERE bucket_id = 'avatars';
  
  -- Delete all files from product-images bucket (if it exists)
  DELETE FROM storage.objects WHERE bucket_id = 'product-images';
  
  -- Delete all files from public-product-images bucket (if it exists)
  DELETE FROM storage.objects WHERE bucket_id = 'public-product-images';
  
  RAISE NOTICE 'Storage buckets cleaned successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error cleaning storage buckets: %', SQLERRM;
END $$;

-- ============================================
-- PART 2: Clean Tables (in order to respect foreign keys)
-- ============================================

-- First, delete from tables that reference other tables (child tables)
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.purchased_products CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.seller_earnings CASCADE;
TRUNCATE TABLE public.withdrawal_requests CASCADE;
TRUNCATE TABLE public.payment_transactions CASCADE;

-- Then delete from tables that are referenced (parent tables)
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.conversations CASCADE;

-- Delete from subscription and analytics tables
TRUNCATE TABLE public.seller_subscriptions CASCADE;
TRUNCATE TABLE public.analytics_report_schedules CASCADE;

-- Delete from newsletter and user-related tables
TRUNCATE TABLE public.newsletter_subscribers CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;

-- Note: We do NOT delete from auth.users or public.profiles
-- as these are tied to authentication and should be managed separately
-- If you want to clean profiles too, uncomment the line below:
-- TRUNCATE TABLE public.profiles CASCADE;

-- ============================================
-- PART 3: Reset Sequences (if any)
-- ============================================

-- Reset any sequences that might exist
-- (PostgreSQL auto-increment sequences are usually handled automatically)

-- ============================================
-- Summary
-- ============================================
-- This migration has:
-- 1. Deleted all files from storage buckets (avatars, product-files, product-images)
-- 2. Truncated all marketplace data tables
-- 3. Preserved the schema structure and RLS policies
-- 4. Preserved auth.users and profiles (uncomment if you want to clean those too)

