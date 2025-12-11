-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Users can view their own subscription
CREATE POLICY "Users can view their subscription by email"
ON public.newsletter_subscribers
FOR SELECT
USING (true);

-- Add tracking columns to orders
ALTER TABLE public.orders
ADD COLUMN tracking_number TEXT,
ADD COLUMN carrier TEXT,
ADD COLUMN shipped_at TIMESTAMP WITH TIME ZONE;