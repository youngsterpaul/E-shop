
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view products" ON public.products 
  FOR SELECT USING (true);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view reviews" ON public.reviews 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews 
  FOR UPDATE USING (auth.uid() = user_id);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_products_categories ON public.products(categories);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Optimize cart system - add missing constraints
ALTER TABLE public.carts ADD CONSTRAINT check_cart_status 
  CHECK (status IN ('active', 'checkout', 'completed', 'abandoned'));

-- Add proper foreign key constraints where missing
ALTER TABLE public.cart_items 
  ADD CONSTRAINT fk_cart_items_product_id 
  FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;

-- Clean up potentially unused tables (with safety checks)
-- Note: These tables appear to have minimal usage in the codebase
-- Consider removing after confirming they're not needed:

-- Drop callback_ip_whitelist if not used by M-Pesa integration
-- DROP TABLE IF EXISTS public.callback_ip_whitelist;

-- Drop daily_sales if analytics are handled elsewhere
-- DROP TABLE IF EXISTS public.daily_sales;

-- Drop inventory_movements if inventory tracking is not implemented
-- DROP TABLE IF EXISTS public.inventory_movements;

-- Optimize large text columns for better performance
ALTER TABLE public.products ALTER COLUMN description TYPE text;
ALTER TABLE public.reviews ALTER COLUMN comment TYPE text;

-- Add updated_at triggers for tables that need them
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables missing this trigger
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
