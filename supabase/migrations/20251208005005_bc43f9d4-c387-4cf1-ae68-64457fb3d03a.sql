-- Fix: Remove overly permissive public profiles policy
-- The existing "Users can view their own profile" policy already provides proper access control
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;