-- Fix get_seller_balance function - add missing FROM clause
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
    COALESCE((SELECT SUM(wr.amount) FROM withdrawal_requests wr WHERE wr.seller_id = p_seller_id AND wr.status = 'completed'), 0) as total_withdrawn
  FROM seller_earnings se
  WHERE se.seller_id = p_seller_id;
END;
$$;

