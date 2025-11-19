-- Fix RLS performance issues by wrapping auth.uid() calls in SELECT
-- This causes the auth function to be evaluated once as an initplan rather than for each row

-- admin_activity_logs policies
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can view activity logs" 
ON public.admin_activity_logs 
FOR SELECT 
USING (is_any_admin((SELECT auth.uid())));

-- suppliers policies
DROP POLICY IF EXISTS "Admins can view suppliers" ON public.suppliers;
CREATE POLICY "Admins can view suppliers" 
ON public.suppliers 
FOR SELECT 
USING (is_any_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can insert suppliers" ON public.suppliers;
CREATE POLICY "Admins can insert suppliers" 
ON public.suppliers 
FOR INSERT 
WITH CHECK (is_any_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can update suppliers" ON public.suppliers;
CREATE POLICY "Admins can update suppliers" 
ON public.suppliers 
FOR UPDATE 
USING (is_any_admin((SELECT auth.uid())))
WITH CHECK (is_any_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;
CREATE POLICY "Admins can delete suppliers" 
ON public.suppliers 
FOR DELETE 
USING (is_any_admin((SELECT auth.uid())));

-- purchase_orders policies
DROP POLICY IF EXISTS "Admins can view purchase orders" ON public.purchase_orders;
CREATE POLICY "Admins can view purchase orders" 
ON public.purchase_orders 
FOR SELECT 
USING (is_any_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can insert purchase orders" ON public.purchase_orders;
CREATE POLICY "Admins can insert purchase orders" 
ON public.purchase_orders 
FOR INSERT 
WITH CHECK (is_any_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can update purchase orders" ON public.purchase_orders;
CREATE POLICY "Admins can update purchase orders" 
ON public.purchase_orders 
FOR UPDATE 
USING (is_any_admin((SELECT auth.uid())))
WITH CHECK (is_any_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can delete purchase orders" ON public.purchase_orders;
CREATE POLICY "Admins can delete purchase orders" 
ON public.purchase_orders 
FOR DELETE 
USING (is_any_admin((SELECT auth.uid())));

-- purchase_order_items policies
DROP POLICY IF EXISTS "Admins can manage purchase order items" ON public.purchase_order_items;
CREATE POLICY "Admins can manage purchase order items" 
ON public.purchase_order_items 
FOR ALL 
USING (is_any_admin((SELECT auth.uid())))
WITH CHECK (is_any_admin((SELECT auth.uid())));