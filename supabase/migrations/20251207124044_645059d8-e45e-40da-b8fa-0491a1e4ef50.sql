-- Allow sellers to update order status for orders containing their products
CREATE POLICY "Sellers can update orders containing their products"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM order_items
    WHERE order_items.order_id = orders.id
    AND order_items.seller_id = auth.uid()
  )
);