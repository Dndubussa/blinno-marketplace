-- Create seller subscriptions table
CREATE TABLE public.seller_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'business')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id)
);

-- Enable RLS
ALTER TABLE public.seller_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Sellers can view their own subscription"
ON public.seller_subscriptions
FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own subscription"
ON public.seller_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own subscription"
ON public.seller_subscriptions
FOR UPDATE
USING (auth.uid() = seller_id);

-- Admin can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.seller_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_seller_subscriptions_updated_at
BEFORE UPDATE ON public.seller_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();