-- Allow users to add 'seller' role to themselves
CREATE POLICY "Users can become sellers"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'seller'
);