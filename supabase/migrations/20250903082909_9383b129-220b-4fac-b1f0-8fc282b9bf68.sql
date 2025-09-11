-- Fix the cart unique constraint issue and add performance indexes
-- The current constraint is causing issues, let's make it more flexible

-- First drop the problematic constraint
ALTER TABLE public.carts DROP CONSTRAINT IF EXISTS unique_active_session_cart;

-- Create a more flexible constraint that allows proper cart management
-- Only one active cart per user OR per session (but not both)
CREATE UNIQUE INDEX unique_user_active_cart 
ON public.carts (user_id) 
WHERE status = 'active' AND user_id IS NOT NULL;

CREATE UNIQUE INDEX unique_session_active_cart 
ON public.carts (session_id) 
WHERE status = 'active' AND session_id IS NOT NULL AND user_id IS NULL;

-- Add indexes for better query performance on frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_carts_user_status ON public.carts (user_id, status) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carts_session_status ON public.carts (session_id, status) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_product ON public.cart_items (cart_id, product_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_categories ON public.products USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders (user_id, status) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product ON public.wishlists (user_id, product_id);

-- Analyze tables for better query planning
ANALYZE public.carts;
ANALYZE public.cart_items;
ANALYZE public.products;
ANALYZE public.orders;
ANALYZE public.reviews;
ANALYZE public.wishlists;