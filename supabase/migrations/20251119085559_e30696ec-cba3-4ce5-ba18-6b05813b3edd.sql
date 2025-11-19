-- Add missing indexes for foreign keys to improve join performance
-- These indexes are essential for queries that join tables via foreign keys

-- Index for category_icons.category_id foreign key
CREATE INDEX IF NOT EXISTS idx_category_icons_category_id 
ON public.category_icons(category_id);

-- Index for category_icons.subcategory_id foreign key
CREATE INDEX IF NOT EXISTS idx_category_icons_subcategory_id 
ON public.category_icons(subcategory_id);

-- Index for mpesa_payments.order_id foreign key
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_order_id 
ON public.mpesa_payments(order_id);

-- Index for products.preferred_supplier_id foreign key
CREATE INDEX IF NOT EXISTS idx_products_preferred_supplier_id 
ON public.products(preferred_supplier_id);