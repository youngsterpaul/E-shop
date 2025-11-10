-- ============================================
-- Fix Multiple Permissive Policies
-- Consolidate overlapping SELECT policies for better performance
-- ============================================

-- ============================================
-- 1. FIX category_icons table
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Superadmins manage category icons" ON public.category_icons;
DROP POLICY IF EXISTS "View category icons" ON public.category_icons;

-- Create consolidated policies
-- Everyone can view category icons
CREATE POLICY "View category icons" ON public.category_icons
FOR SELECT
USING (true);

-- Superadmins can perform all operations (INSERT, UPDATE, DELETE)
CREATE POLICY "Superadmins manage category icons" ON public.category_icons
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- ============================================
-- 2. FIX mpesa_payments table
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Service role manages payments" ON public.mpesa_payments;
DROP POLICY IF EXISTS "View mpesa payments" ON public.mpesa_payments;

-- Create consolidated policies
-- Single SELECT policy combining all access rules
CREATE POLICY "View mpesa payments" ON public.mpesa_payments
FOR SELECT
USING (
  current_setting('role', true) = 'service_role'
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR EXISTS (
    SELECT 1 FROM orders
    WHERE orders.order_id = mpesa_payments.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Service role can manage all operations (INSERT, UPDATE, DELETE)
CREATE POLICY "Service role manages payments" ON public.mpesa_payments
FOR ALL
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');

-- ============================================
-- 3. FIX mpesa_rate_limit table
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.mpesa_rate_limit;
DROP POLICY IF EXISTS "View rate limits" ON public.mpesa_rate_limit;

-- Create consolidated policies
-- Single SELECT policy combining service role and superadmin access
CREATE POLICY "View rate limits" ON public.mpesa_rate_limit
FOR SELECT
USING (
  current_setting('role', true) = 'service_role'
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- Service role can manage all operations (INSERT, UPDATE, DELETE)
CREATE POLICY "Service role manages rate limits" ON public.mpesa_rate_limit
FOR ALL
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');