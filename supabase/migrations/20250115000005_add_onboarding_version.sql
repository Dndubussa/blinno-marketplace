-- Add onboarding version support for future onboarding updates
-- This allows forcing re-onboarding for versioned updates

-- Add onboarding_version column to seller_profiles
ALTER TABLE public.seller_profiles
ADD COLUMN IF NOT EXISTS onboarding_version INTEGER DEFAULT 1;

-- Add comment
COMMENT ON COLUMN public.seller_profiles.onboarding_version IS 'Version of onboarding completed. Incremented when onboarding requirements change.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_seller_profiles_onboarding_version ON public.seller_profiles(onboarding_version);

-- Create function to check if user needs onboarding based on version
CREATE OR REPLACE FUNCTION public.needs_onboarding(p_user_id UUID, p_required_version INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_onboarding_completed BOOLEAN;
  v_onboarding_version INTEGER;
BEGIN
  SELECT onboarding_completed, onboarding_version
  INTO v_onboarding_completed, v_onboarding_version
  FROM public.seller_profiles
  WHERE user_id = p_user_id;
  
  -- If no seller profile exists, needs onboarding
  IF v_onboarding_completed IS NULL THEN
    RETURN true;
  END IF;
  
  -- If onboarding not completed, needs onboarding
  IF NOT v_onboarding_completed THEN
    RETURN true;
  END IF;
  
  -- If onboarding version is less than required, needs onboarding
  IF v_onboarding_version IS NULL OR v_onboarding_version < p_required_version THEN
    RETURN true;
  END IF;
  
  -- Otherwise, onboarding is complete
  RETURN false;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION public.needs_onboarding IS 'Checks if user needs to complete onboarding based on completion status and version';

