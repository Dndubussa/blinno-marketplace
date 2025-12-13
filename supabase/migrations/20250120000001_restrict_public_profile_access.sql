-- Security Fix: Restrict public profile access
-- This migration restricts anonymous access to profiles to prevent email exposure
-- Only authenticated users can view profiles (needed for marketplace functionality)

-- Drop the overly permissive public profile policy
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

-- Create a new policy that allows authenticated users to view profiles
-- This is needed for marketplace features like seller storefronts
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Note: If you need public seller profiles for storefronts, consider:
-- 1. Creating a separate public_seller_profiles view with limited fields (no email)
-- 2. Or adding a public_profile boolean field to profiles table
-- 3. Or creating a function that returns only public fields

