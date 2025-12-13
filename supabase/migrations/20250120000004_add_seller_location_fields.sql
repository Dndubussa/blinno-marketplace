-- Add seller location fields to profiles table
-- This enables same-country exemption logic for shipping and tax calculations

-- Add location fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.country IS 'Seller country/region for location-based shipping and tax calculations';
COMMENT ON COLUMN public.profiles.city IS 'Seller city for location-based shipping and tax calculations';
COMMENT ON COLUMN public.profiles.state IS 'Seller state/region for location-based shipping and tax calculations';
COMMENT ON COLUMN public.profiles.address IS 'Seller address (optional, for more specific location)';

-- Create index on country for faster lookups when checking same-country matches
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country) WHERE country IS NOT NULL;

-- Create index on city for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city) WHERE city IS NOT NULL;

