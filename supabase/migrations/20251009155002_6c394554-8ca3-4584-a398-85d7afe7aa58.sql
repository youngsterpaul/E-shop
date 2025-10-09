-- Add indexes to optimize frequently queried columns

-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for featured products queries (featured flag + created_at ordering)
CREATE INDEX IF NOT EXISTS idx_products_featured_created_at 
ON public.products(featured, created_at DESC) 
WHERE featured = true;

-- Index for cart session lookups (session_id + status)
CREATE INDEX IF NOT EXISTS idx_carts_session_status 
ON public.carts(session_id, status) 
WHERE session_id IS NOT NULL;

-- Index for cart user lookups (user_id + status)
CREATE INDEX IF NOT EXISTS idx_carts_user_status 
ON public.carts(user_id, status) 
WHERE user_id IS NOT NULL;

-- Index for product categories filter (using btree for varchar column)
CREATE INDEX IF NOT EXISTS idx_products_categories 
ON public.products(categories);

-- Index for product name search using trigrams
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON public.products USING gin(name gin_trgm_ops);

-- Index for product description search using trigrams
CREATE INDEX IF NOT EXISTS idx_products_description_trgm 
ON public.products USING gin(description gin_trgm_ops);

-- Analyze tables to update statistics after index creation
ANALYZE public.products;
ANALYZE public.carts;