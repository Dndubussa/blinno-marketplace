-- Ensure products are visible to all user types (anonymous, authenticated buyers, authenticated sellers)
-- This migration makes the RLS policy explicit for anonymous users

-- Drop the existing policy if it exists (to recreate with explicit role)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Recreate the policy explicitly allowing anonymous users
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
TO public
USING (is_active = true);

-- Note: The "Sellers can view their own products" policy already allows authenticated sellers
-- to view their own products (including inactive ones), which is correct behavior.

