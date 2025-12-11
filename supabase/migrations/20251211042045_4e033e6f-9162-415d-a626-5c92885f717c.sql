-- Make product-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'product-files';

-- Drop the public access policy for product files
DROP POLICY IF EXISTS "Anyone can view product files" ON storage.objects;

-- Create policy for purchasers to view product files (through signed URLs only)
CREATE POLICY "Purchasers can view purchased product files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-files' 
  AND (
    -- Allow access if user purchased a product from this seller's folder
    EXISTS (
      SELECT 1 FROM public.purchased_products pp
      JOIN public.products p ON p.id = pp.product_id
      WHERE pp.user_id = auth.uid()
      AND p.seller_id::text = (storage.foldername(name))[1]
    )
    -- Or if user is the seller who owns the files
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Keep existing policies for sellers to manage their own files
-- (These should already exist, but ensure they're present)