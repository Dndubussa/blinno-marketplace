-- Add seller type support to profiles and create seller_profiles table
-- This migration adds support for multi-profile onboarding system

-- Add seller_type column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS seller_type TEXT;

-- Add comment to explain seller_type values
COMMENT ON COLUMN public.profiles.seller_type IS 'Type of seller: individual, business, artist, content_creator, online_teacher, musician, photographer, writer, restaurant, event_organizer, service_provider, other';

-- Create seller_profiles table for category-specific data
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  seller_type TEXT NOT NULL,
  category_specific_data JSONB DEFAULT '{}'::jsonb,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on seller_type for faster queries
CREATE INDEX IF NOT EXISTS idx_seller_profiles_seller_type ON public.seller_profiles(seller_type);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON public.seller_profiles(user_id);

-- Enable RLS on seller_profiles
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_profiles
CREATE POLICY "Users can view their own seller profile"
ON public.seller_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller profile"
ON public.seller_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seller profile"
ON public.seller_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Public seller profiles can be viewed by everyone (for marketplace listings)
CREATE POLICY "Public seller profiles are viewable"
ON public.seller_profiles FOR SELECT
TO anon
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_seller_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_seller_profiles_updated_at
  BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seller_profiles_updated_at();

-- Create function to sync seller_type from seller_profiles to profiles
CREATE OR REPLACE FUNCTION public.sync_seller_type_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profiles.seller_type when seller_profiles.seller_type changes
  UPDATE public.profiles
  SET seller_type = NEW.seller_type
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync seller_type
CREATE TRIGGER sync_seller_type_to_profile_trigger
  AFTER INSERT OR UPDATE OF seller_type ON public.seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_seller_type_to_profile();

-- Add comment to table
COMMENT ON TABLE public.seller_profiles IS 'Stores seller-specific profile data including type and category-specific information';

