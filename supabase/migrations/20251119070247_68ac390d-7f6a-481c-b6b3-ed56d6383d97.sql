-- Fix RLS performance issues by optimizing auth function calls and consolidating policies

-- 1. Fix category_icons policies
-- Drop existing policies
DROP POLICY IF EXISTS "Superadmins manage category icons" ON public.category_icons;
DROP POLICY IF EXISTS "View category icons" ON public.category_icons;

-- Create optimized consolidated policy for SELECT
CREATE POLICY "category_icons_select_policy" ON public.category_icons
FOR SELECT
USING (
  true -- Everyone can view
  OR has_role((SELECT auth.uid()), 'superadmin'::app_role)
);

-- Create optimized policy for INSERT, UPDATE, DELETE (superadmins only)
CREATE POLICY "category_icons_modify_policy" ON public.category_icons
FOR ALL
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- 2. Fix mpesa_payments policies
DROP POLICY IF EXISTS "Service role manages payments" ON public.mpesa_payments;
DROP POLICY IF EXISTS "View mpesa payments" ON public.mpesa_payments;

-- Consolidated SELECT policy
CREATE POLICY "mpesa_payments_select_policy" ON public.mpesa_payments
FOR SELECT
USING (
  (current_setting('role'::text, true) = 'service_role'::text)
  OR has_role((SELECT auth.uid()), 'superadmin'::app_role)
  OR (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.order_id = mpesa_payments.order_id
    AND orders.user_id = (SELECT auth.uid())
  ))
);

-- Service role manages all operations
CREATE POLICY "mpesa_payments_service_role_policy" ON public.mpesa_payments
FOR ALL
USING (current_setting('role'::text, true) = 'service_role'::text)
WITH CHECK (current_setting('role'::text, true) = 'service_role'::text);

-- 3. Fix mpesa_rate_limit policies
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.mpesa_rate_limit;
DROP POLICY IF EXISTS "View rate limits" ON public.mpesa_rate_limit;

-- Consolidated SELECT policy
CREATE POLICY "mpesa_rate_limit_select_policy" ON public.mpesa_rate_limit
FOR SELECT
USING (
  (current_setting('role'::text, true) = 'service_role'::text)
  OR has_role((SELECT auth.uid()), 'superadmin'::app_role)
);

-- Service role manages all operations
CREATE POLICY "mpesa_rate_limit_service_role_policy" ON public.mpesa_rate_limit
FOR ALL
USING (current_setting('role'::text, true) = 'service_role'::text)
WITH CHECK (current_setting('role'::text, true) = 'service_role'::text);

-- 4. Fix login_audit policy
DROP POLICY IF EXISTS "Superadmins can view login audits" ON public.login_audit;

CREATE POLICY "login_audit_select_policy" ON public.login_audit
FOR SELECT
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- 5. Fix session_activity policies
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.session_activity;
DROP POLICY IF EXISTS "Superadmins can view all sessions" ON public.session_activity;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.session_activity;

-- Consolidated SELECT policy
CREATE POLICY "session_activity_select_policy" ON public.session_activity
FOR SELECT
USING (
  ((SELECT auth.uid()) = user_id)
  OR has_role((SELECT auth.uid()), 'superadmin'::app_role)
);

-- Service role manages all operations
CREATE POLICY "session_activity_service_role_policy" ON public.session_activity
FOR ALL
USING (true)
WITH CHECK (true);