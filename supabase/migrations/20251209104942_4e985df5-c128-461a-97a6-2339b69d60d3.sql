-- Add category-specific attributes column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

-- Create storage bucket for product files (audio, video, ebooks, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product files
CREATE POLICY "Anyone can view product files"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-files');

CREATE POLICY "Sellers can upload product files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sellers can update their product files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sellers can delete their product files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);