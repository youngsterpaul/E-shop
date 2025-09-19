-- Fix remaining RLS performance issues and duplicate indexes

-- Fix auth function optimization for mpesa_payments policy
DROP POLICY IF EXISTS "Service role and admins can manage payments" ON public.mpesa_payments;

CREATE POLICY "Service role and admins can manage payments" 
ON public.mpesa_payments 
FOR ALL 
USING (check_is_admin() OR (current_setting('role'::text) = 'service_role'::text))
WITH CHECK (check_is_admin() OR (current_setting('role'::text) = 'service_role'::text));

-- Consolidate mpesa_payments SELECT policies 
DROP POLICY IF EXISTS "Users can view their own payment records" ON public.mpesa_payments;

CREATE POLICY "Users can view their payment records or admins can view all" 
ON public.mpesa_payments 
FOR SELECT 
USING (
  check_is_admin() OR 
  (current_setting('role'::text) = 'service_role'::text) OR
  (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.order_id = mpesa_payments.order_id 
    AND orders.user_id = (SELECT auth.uid())
  ))
);

-- Consolidate orders policies
DROP POLICY IF EXISTS "public_insert" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Create consolidated orders policies
CREATE POLICY "Orders management" 
ON public.orders 
FOR ALL 
USING (check_is_admin() OR ((SELECT auth.uid()) = user_id))
WITH CHECK (check_is_admin() OR ((SELECT auth.uid()) = user_id));

CREATE POLICY "Public can insert orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Consolidate product_variants policies
DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Everyone can view product variants" ON public.product_variants;

-- Create consolidated product_variants policies
CREATE POLICY "Product variants access" 
ON public.product_variants 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product variants" 
ON public.product_variants 
FOR INSERT, UPDATE, DELETE 
USING (check_is_admin())
WITH CHECK (check_is_admin());

-- Drop duplicate index on carts table
DROP INDEX IF EXISTS unique_active_user_cart;
-- Keep unique_user_active_cart as it's the more descriptive name