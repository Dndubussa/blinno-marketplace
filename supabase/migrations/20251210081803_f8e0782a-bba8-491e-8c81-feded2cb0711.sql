-- Create a table to track purchased products (digital content access)
CREATE TABLE IF NOT EXISTS public.purchased_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.purchased_products ENABLE ROW LEVEL SECURITY;

-- Users can only view their own purchased products
CREATE POLICY "Users can view their own purchased products"
ON public.purchased_products
FOR SELECT
USING (auth.uid() = user_id);

-- System/admin can insert purchased products (done via triggers/functions)
CREATE POLICY "System can insert purchased products"
ON public.purchased_products
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create a function to auto-populate purchased_products when order is completed
CREATE OR REPLACE FUNCTION public.handle_order_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When order status changes to 'completed' or 'delivered'
  IF NEW.status IN ('completed', 'delivered') AND OLD.status NOT IN ('completed', 'delivered') THEN
    -- Insert purchased products for all items in this order
    INSERT INTO public.purchased_products (user_id, product_id, order_id)
    SELECT NEW.buyer_id, oi.product_id, NEW.id
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
    ON CONFLICT (user_id, product_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for order completion
DROP TRIGGER IF EXISTS on_order_completed ON public.orders;
CREATE TRIGGER on_order_completed
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_completion();

-- Also handle immediate purchase completion for pending orders with payment
-- This ensures digital products are accessible once payment is confirmed
CREATE OR REPLACE FUNCTION public.handle_payment_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When payment status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update order status
    UPDATE public.orders 
    SET status = 'paid'
    WHERE id = NEW.order_id;
    
    -- Insert purchased products for digital access
    INSERT INTO public.purchased_products (user_id, product_id, order_id)
    SELECT NEW.user_id, oi.product_id, NEW.order_id
    FROM public.order_items oi
    WHERE oi.order_id = NEW.order_id
    ON CONFLICT (user_id, product_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment completion
DROP TRIGGER IF EXISTS on_payment_completed ON public.payment_transactions;
CREATE TRIGGER on_payment_completed
  AFTER UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payment_completion();