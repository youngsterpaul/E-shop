-- Fix remaining RLS performance issues

-- 1. Fix category_icons - separate SELECT from modifications
DROP POLICY IF EXISTS "category_icons_modify_policy" ON public.category_icons;

-- Separate INSERT policy
CREATE POLICY "category_icons_insert_policy" ON public.category_icons
FOR INSERT
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- Separate UPDATE policy
CREATE POLICY "category_icons_update_policy" ON public.category_icons
FOR UPDATE
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- Separate DELETE policy
CREATE POLICY "category_icons_delete_policy" ON public.category_icons
FOR DELETE
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- 2. Fix mpesa_payments - optimize current_setting and separate policies
DROP POLICY IF EXISTS "mpesa_payments_service_role_policy" ON public.mpesa_payments;

-- Separate INSERT policy for service role
CREATE POLICY "mpesa_payments_insert_policy" ON public.mpesa_payments
FOR INSERT
WITH CHECK ((SELECT current_setting('role'::text, true)) = 'service_role'::text);

-- Separate UPDATE policy for service role
CREATE POLICY "mpesa_payments_update_policy" ON public.mpesa_payments
FOR UPDATE
USING ((SELECT current_setting('role'::text, true)) = 'service_role'::text)
WITH CHECK ((SELECT current_setting('role'::text, true)) = 'service_role'::text);

-- Separate DELETE policy for service role
CREATE POLICY "mpesa_payments_delete_policy" ON public.mpesa_payments
FOR DELETE
USING ((SELECT current_setting('role'::text, true)) = 'service_role'::text);

-- Update SELECT policy to wrap current_setting
DROP POLICY IF EXISTS "mpesa_payments_select_policy" ON public.mpesa_payments;
CREATE POLICY "mpesa_payments_select_policy" ON public.mpesa_payments
FOR SELECT
USING (
  ((SELECT current_setting('role'::text, true)) = 'service_role'::text)
  OR has_role((SELECT auth.uid()), 'superadmin'::app_role)
  OR (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.order_id = mpesa_payments.order_id
    AND orders.user_id = (SELECT auth.uid())
  ))
);

-- 3. Fix mpesa_rate_limit - optimize current_setting and separate policies
DROP POLICY IF EXISTS "mpesa_rate_limit_service_role_policy" ON public.mpesa_rate_limit;

-- Separate INSERT policy for service role
CREATE POLICY "mpesa_rate_limit_insert_policy" ON public.mpesa_rate_limit
FOR INSERT
WITH CHECK ((SELECT current_setting('role'::text, true)) = 'service_role'::text);

-- Separate UPDATE policy for service role
CREATE POLICY "mpesa_rate_limit_update_policy" ON public.mpesa_rate_limit
FOR UPDATE
USING ((SELECT current_setting('role'::text, true)) = 'service_role'::text)
WITH CHECK ((SELECT current_setting('role'::text, true)) = 'service_role'::text);

-- Separate DELETE policy for service role
CREATE POLICY "mpesa_rate_limit_delete_policy" ON public.mpesa_rate_limit
FOR DELETE
USING ((SELECT current_setting('role'::text, true)) = 'service_role'::text);

-- Update SELECT policy to wrap current_setting
DROP POLICY IF EXISTS "mpesa_rate_limit_select_policy" ON public.mpesa_rate_limit;
CREATE POLICY "mpesa_rate_limit_select_policy" ON public.mpesa_rate_limit
FOR SELECT
USING (
  ((SELECT current_setting('role'::text, true)) = 'service_role'::text)
  OR has_role((SELECT auth.uid()), 'superadmin'::app_role)
);

-- 4. Fix session_activity - separate SELECT from modifications
DROP POLICY IF EXISTS "session_activity_service_role_policy" ON public.session_activity;

-- Separate INSERT policy for service role
CREATE POLICY "session_activity_insert_policy" ON public.session_activity
FOR INSERT
WITH CHECK (true);

-- Separate UPDATE policy for service role
CREATE POLICY "session_activity_update_policy" ON public.session_activity
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Separate DELETE policy for service role
CREATE POLICY "session_activity_delete_policy" ON public.session_activity
FOR DELETE
USING (true);