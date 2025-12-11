-- Fix: Restrict newsletter_subscribers SELECT to admins only
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Users can view their subscription by email" ON public.newsletter_subscribers;

-- Create admin-only policy for viewing subscribers
CREATE POLICY "Admins can view all subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));