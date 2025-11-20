-- Optimize RLS policies for better performance
-- Fix auth_rls_initplan warnings by wrapping auth.uid() in SELECT
-- Consolidate duplicate permissive policies

-- ============================================
-- PRODUCTS TABLE - Consolidate and optimize
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view products" ON public.products;
DROP POLICY IF EXISTS "Moderators can view products" ON public.products;
DROP POLICY IF EXISTS "Moderators can insert products" ON public.products;
DROP POLICY IF EXISTS "Moderators can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Create optimized policies
CREATE POLICY "Everyone can view products"
ON public.products
FOR SELECT
TO public
USING (true);

CREATE POLICY "Moderators can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (is_any_admin((select auth.uid())) OR has_role((select auth.uid()), 'moderator'::app_role));

CREATE POLICY "Moderators can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (is_any_admin((select auth.uid())) OR has_role((select auth.uid()), 'moderator'::app_role))
WITH CHECK (is_any_admin((select auth.uid())) OR has_role((select auth.uid()), 'moderator'::app_role));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (is_any_admin((select auth.uid())));

-- ============================================
-- ROLE_CHANGE_HISTORY TABLE - Optimize
-- ============================================

DROP POLICY IF EXISTS "Superadmins can view role history" ON public.role_change_history;
DROP POLICY IF EXISTS "Superadmins can update role history" ON public.role_change_history;

CREATE POLICY "Superadmins can view role history"
ON public.role_change_history
FOR SELECT
TO authenticated
USING (has_role((select auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can update role history"
ON public.role_change_history
FOR UPDATE
TO authenticated
USING (has_role((select auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((select auth.uid()), 'superadmin'::app_role));

-- ============================================
-- ORDERS TABLE - Optimize
-- ============================================

DROP POLICY IF EXISTS "Admins and moderators can view orders" ON public.orders;
DROP POLICY IF EXISTS "Admins and moderators can update orders" ON public.orders;

CREATE POLICY "Admins and moderators can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  has_role((select auth.uid()), 'superadmin'::app_role) 
  OR has_role((select auth.uid()), 'moderator'::app_role) 
  OR (user_id = (select auth.uid()))
);

CREATE POLICY "Admins and moderators can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  has_role((select auth.uid()), 'superadmin'::app_role) 
  OR has_role((select auth.uid()), 'moderator'::app_role)
)
WITH CHECK (
  has_role((select auth.uid()), 'superadmin'::app_role) 
  OR has_role((select auth.uid()), 'moderator'::app_role)
);

-- ============================================
-- PRODUCT_VARIANTS TABLE - Optimize
-- ============================================

DROP POLICY IF EXISTS "Admins and moderators can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins and moderators can update product variants" ON public.product_variants;

CREATE POLICY "Admins and moderators can insert product variants"
ON public.product_variants
FOR INSERT
TO authenticated
WITH CHECK (is_any_admin((select auth.uid())) OR has_role((select auth.uid()), 'moderator'::app_role));

CREATE POLICY "Admins and moderators can update product variants"
ON public.product_variants
FOR UPDATE
TO authenticated
USING (is_any_admin((select auth.uid())) OR has_role((select auth.uid()), 'moderator'::app_role))
WITH CHECK (is_any_admin((select auth.uid())) OR has_role((select auth.uid()), 'moderator'::app_role));

-- ============================================
-- ADMIN_ACTIVITY_LOGS TABLE - Optimize
-- ============================================

DROP POLICY IF EXISTS "Admins and moderators can view activity logs" ON public.admin_activity_logs;

CREATE POLICY "Admins and moderators can view activity logs"
ON public.admin_activity_logs
FOR SELECT
TO authenticated
USING (is_any_admin((select auth.uid())) OR has_role((select auth.uid()), 'moderator'::app_role));