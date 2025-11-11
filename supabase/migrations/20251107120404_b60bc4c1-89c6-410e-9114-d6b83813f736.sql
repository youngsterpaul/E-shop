-- Fix remaining multiple permissive policies by consolidating into single policies
-- This eliminates duplicate policy execution for better performance

-- ============================================================================
-- ADMIN_SETTINGS - Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Everyone can view admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Superadmins can modify admin settings" ON public.admin_settings;

-- Single SELECT policy (everyone can read)
CREATE POLICY "View admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (true);

-- Separate policies for modifications (superadmin only)
CREATE POLICY "Superadmins modify admin settings" 
ON public.admin_settings 
FOR INSERT 
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins update admin settings" 
ON public.admin_settings 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins delete admin settings" 
ON public.admin_settings 
FOR DELETE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- MPESA_PAYMENTS - Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Service role can manage payments" ON public.mpesa_payments;
DROP POLICY IF EXISTS "Superadmins view all payments" ON public.mpesa_payments;
DROP POLICY IF EXISTS "Users view own payments" ON public.mpesa_payments;

-- Single consolidated SELECT policy
CREATE POLICY "View mpesa payments" 
ON public.mpesa_payments 
FOR SELECT 
USING (
  -- Service role can see all
  (SELECT current_setting('role', true)) = 'service_role'
  OR
  -- Superadmins can see all
  has_role((SELECT auth.uid()), 'superadmin'::app_role)
  OR
  -- Users can see their own
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.order_id = mpesa_payments.order_id 
    AND orders.user_id = (SELECT auth.uid())
  )
);

-- Service role can manage (INSERT, UPDATE, DELETE)
CREATE POLICY "Service role manages payments" 
ON public.mpesa_payments 
FOR ALL 
USING ((SELECT current_setting('role', true)) = 'service_role')
WITH CHECK ((SELECT current_setting('role', true)) = 'service_role');

-- ============================================================================
-- MPESA_RATE_LIMIT - Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.mpesa_rate_limit;
DROP POLICY IF EXISTS "Superadmins view rate limits" ON public.mpesa_rate_limit;

-- Single consolidated SELECT policy
CREATE POLICY "View rate limits" 
ON public.mpesa_rate_limit 
FOR SELECT 
USING (
  (SELECT current_setting('role', true)) = 'service_role'
  OR
  has_role((SELECT auth.uid()), 'superadmin'::app_role)
);

-- Service role can manage (INSERT, UPDATE, DELETE)
CREATE POLICY "Service role manages rate limits" 
ON public.mpesa_rate_limit 
FOR ALL 
USING ((SELECT current_setting('role', true)) = 'service_role')
WITH CHECK ((SELECT current_setting('role', true)) = 'service_role');

-- ============================================================================
-- ORDERS - Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;

-- Single consolidated SELECT policy
CREATE POLICY "View orders" 
ON public.orders 
FOR SELECT 
USING (
  has_role((SELECT auth.uid()), 'superadmin'::app_role)
  OR
  user_id = (SELECT auth.uid())
);

-- ============================================================================
-- PROFILES - Consolidate all action policies
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "User can insert own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON public.profiles;

-- Single consolidated INSERT policy
CREATE POLICY "Insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  has_role((SELECT auth.uid()), 'superadmin'::app_role)
  OR
  user_id = (SELECT auth.uid())
);

-- Single consolidated UPDATE policy
CREATE POLICY "Update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  has_role((SELECT auth.uid()), 'superadmin'::app_role)
  OR
  user_id = (SELECT auth.uid())
)
WITH CHECK (
  has_role((SELECT auth.uid()), 'superadmin'::app_role)
  OR
  user_id = (SELECT auth.uid())
);

-- Single consolidated DELETE policy
CREATE POLICY "Delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
  has_role((SELECT auth.uid()), 'superadmin'::app_role)
  OR
  user_id = (SELECT auth.uid())
);

-- Single consolidated SELECT policy
CREATE POLICY "View profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role((SELECT auth.uid()), 'superadmin'::app_role)
  OR
  user_id = (SELECT auth.uid())
);

-- ============================================================================
-- CATEGORY_ICONS - Fix the consolidated policy from before
-- ============================================================================
DROP POLICY IF EXISTS "Public read and superadmin manage category icons" ON public.category_icons;

-- Separate SELECT (public) from modifications (superadmin only)
CREATE POLICY "View category icons" 
ON public.category_icons 
FOR SELECT 
USING (true);

CREATE POLICY "Superadmins manage category icons" 
ON public.category_icons 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));