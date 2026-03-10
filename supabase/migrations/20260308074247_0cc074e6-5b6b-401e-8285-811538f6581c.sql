
ALTER TABLE public.flash_sale_products
ADD COLUMN discount_type varchar DEFAULT NULL,
ADD COLUMN discount_value numeric DEFAULT NULL;
