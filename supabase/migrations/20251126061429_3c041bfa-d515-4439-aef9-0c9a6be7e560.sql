-- Drop and recreate the RLS policy for flash_sale_products to allow everyone to view
DROP POLICY IF EXISTS "Everyone can view flash sale products" ON public.flash_sale_products;

CREATE POLICY "Everyone can view flash sale products"
  ON public.flash_sale_products FOR SELECT
  USING (true);

-- Also ensure everyone can view all flash sales (not just active ones for admin purposes)
DROP POLICY IF EXISTS "Everyone can view active flash sales" ON public.flash_sales;

CREATE POLICY "Everyone can view all flash sales"
  ON public.flash_sales FOR SELECT
  USING (true);