-- Add indexes for foreign keys to improve query performance

-- Index for products.subcategory_id (used in category filtering and JOINs)
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);

-- Index for reviews.user_id (used when fetching user's reviews)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Index for reviews.product_id (used when fetching product reviews)
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);