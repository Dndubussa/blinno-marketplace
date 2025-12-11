-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  images TEXT[] DEFAULT '{}',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true);

CREATE POLICY "Sellers can view their own products"
ON public.products FOR SELECT
TO authenticated
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seller_id AND public.has_role(auth.uid(), 'seller'));

CREATE POLICY "Sellers can update their own products"
ON public.products FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products"
ON public.products FOR DELETE
TO authenticated
USING (auth.uid() = seller_id);

-- Orders policies
CREATE POLICY "Buyers can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = buyer_id);

-- Order items policies
CREATE POLICY "Buyers can view their order items"
ON public.order_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_items.order_id 
  AND orders.buyer_id = auth.uid()
));

CREATE POLICY "Sellers can view their order items"
ON public.order_items FOR SELECT
TO authenticated
USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can insert order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_items.order_id 
  AND orders.buyer_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_products_seller_id ON public.products(seller_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_order_items_seller_id ON public.order_items(seller_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);