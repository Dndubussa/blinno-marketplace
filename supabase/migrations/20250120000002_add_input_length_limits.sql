-- Security Fix: Add input length limits to prevent DoS attacks
-- This migration adds length constraints to text fields that accept user input

-- Products table
ALTER TABLE public.products 
  ALTER COLUMN title TYPE VARCHAR(200),
  ALTER COLUMN description TYPE TEXT,
  ALTER COLUMN category TYPE VARCHAR(50),
  ALTER COLUMN subcategory TYPE VARCHAR(100);

-- Add check constraint for products description (drop if exists first)
ALTER TABLE public.products 
  DROP CONSTRAINT IF EXISTS products_description_length_check;
ALTER TABLE public.products 
  ADD CONSTRAINT products_description_length_check CHECK (LENGTH(description) <= 5000);

-- Reviews table
ALTER TABLE public.reviews 
  ALTER COLUMN title TYPE VARCHAR(200),
  ALTER COLUMN content TYPE TEXT;

-- Add check constraint for reviews content (drop if exists first)
ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS reviews_content_length_check;
ALTER TABLE public.reviews 
  ADD CONSTRAINT reviews_content_length_check CHECK (LENGTH(content) <= 2000);

-- Messages table
ALTER TABLE public.messages 
  ALTER COLUMN content TYPE TEXT;

-- Add check constraint for messages content (drop if exists first)
ALTER TABLE public.messages 
  DROP CONSTRAINT IF EXISTS messages_content_length_check;
ALTER TABLE public.messages 
  ADD CONSTRAINT messages_content_length_check CHECK (LENGTH(content) <= 5000);

-- Profiles table
ALTER TABLE public.profiles 
  ALTER COLUMN full_name TYPE VARCHAR(100),
  ALTER COLUMN bio TYPE TEXT,
  ALTER COLUMN email TYPE VARCHAR(255);

-- Add check constraint for profiles bio (drop if exists first)
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_bio_length_check;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_bio_length_check CHECK (LENGTH(bio) <= 1000);

-- Orders table - shipping address is JSONB, validate in application layer
-- But we can add a check constraint for total_amount to prevent extreme values
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_total_amount_check;
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_total_amount_check CHECK (total_amount >= 0 AND total_amount <= 10000000);

-- Order items - validate quantity (drop if exists first)
ALTER TABLE public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_quantity_check,
  DROP CONSTRAINT IF EXISTS order_items_price_check;
ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_quantity_check CHECK (quantity > 0 AND quantity <= 1000),
  ADD CONSTRAINT order_items_price_check CHECK (price_at_purchase >= 0 AND price_at_purchase <= 1000000);

-- Payment transactions - validate amount (drop if exists first)
ALTER TABLE public.payment_transactions 
  DROP CONSTRAINT IF EXISTS payment_transactions_amount_check;
ALTER TABLE public.payment_transactions 
  ADD CONSTRAINT payment_transactions_amount_check CHECK (amount >= 0 AND amount <= 10000000);

-- Seller profiles - need to drop trigger first, then alter column, then recreate trigger
DROP TRIGGER IF EXISTS sync_seller_type_to_profile_trigger ON public.seller_profiles;

ALTER TABLE public.seller_profiles 
  ALTER COLUMN seller_type TYPE VARCHAR(50);

-- Recreate the trigger
CREATE TRIGGER sync_seller_type_to_profile_trigger
  AFTER INSERT OR UPDATE OF seller_type ON public.seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_seller_type_to_profile();

-- Newsletter subscribers
ALTER TABLE public.newsletter_subscribers 
  ALTER COLUMN email TYPE VARCHAR(255);

-- Add indexes for performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_products_title_search ON public.products USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_reviews_content_search ON public.reviews USING gin(to_tsvector('english', content));

