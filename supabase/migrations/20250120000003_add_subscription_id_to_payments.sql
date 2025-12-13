-- Add subscription_id field to payment_transactions table
-- This allows linking payment transactions to subscription upgrades/downgrades

ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.seller_subscriptions(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id 
ON public.payment_transactions(subscription_id);

-- Add comment for documentation
COMMENT ON COLUMN public.payment_transactions.subscription_id IS 'Links payment transaction to a subscription upgrade/downgrade';

