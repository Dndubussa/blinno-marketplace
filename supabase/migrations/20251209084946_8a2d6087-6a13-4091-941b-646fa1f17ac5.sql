-- Create seller_earnings table to track earnings from each order item
CREATE TABLE public.seller_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mpesa',
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  clickpesa_reference TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for seller_earnings
CREATE POLICY "Sellers can view their own earnings"
ON public.seller_earnings
FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all earnings"
ON public.seller_earnings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for withdrawal_requests
CREATE POLICY "Sellers can view their own withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can create withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins can view all withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update withdrawal requests"
ON public.withdrawal_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to calculate seller's available balance
CREATE OR REPLACE FUNCTION public.get_seller_balance(p_seller_id UUID)
RETURNS TABLE (
  total_earnings NUMERIC,
  available_balance NUMERIC,
  pending_withdrawals NUMERIC,
  total_withdrawn NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN se.status = 'completed' THEN se.net_amount ELSE 0 END), 0) as total_earnings,
    COALESCE(SUM(CASE WHEN se.status = 'completed' THEN se.net_amount ELSE 0 END), 0) 
      - COALESCE((SELECT SUM(wr.amount) FROM withdrawal_requests wr WHERE wr.seller_id = p_seller_id AND wr.status IN ('pending', 'processing', 'completed')), 0) as available_balance,
    COALESCE((SELECT SUM(wr.amount) FROM withdrawal_requests wr WHERE wr.seller_id = p_seller_id AND wr.status IN ('pending', 'processing')), 0) as pending_withdrawals,
    COALESCE((SELECT SUM(wr.amount) FROM withdrawal_requests wr WHERE wr.seller_id = p_seller_id AND wr.status = 'completed'), 0) as total_withdrawn;
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_seller_earnings_updated_at
  BEFORE UPDATE ON public.seller_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for these tables
ALTER TABLE public.seller_earnings REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;