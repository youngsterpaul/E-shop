-- Comprehensive RLS performance optimization
-- Fix all auth.uid() re-evaluation issues and consolidate multiple permissive policies

-- ============================================================================
-- SECURITY_ALERTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins manage security alerts" ON public.security_alerts;

CREATE POLICY "Superadmins manage security alerts" 
ON public.security_alerts 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- MPESA_RATE_LIMIT TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.mpesa_rate_limit;
DROP POLICY IF EXISTS "Superadmins view rate limits" ON public.mpesa_rate_limit;

CREATE POLICY "Service role manages rate limits" 
ON public.mpesa_rate_limit 
FOR ALL 
USING ((SELECT current_setting('role', true)) = 'service_role')
WITH CHECK ((SELECT current_setting('role', true)) = 'service_role');

CREATE POLICY "Superadmins view rate limits" 
ON public.mpesa_rate_limit 
FOR SELECT 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- HERO_SLIDES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins can delete hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Superadmins can insert hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Superadmins can update hero slides" ON public.hero_slides;

CREATE POLICY "Superadmins can delete hero slides" 
ON public.hero_slides 
FOR DELETE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can insert hero slides" 
ON public.hero_slides 
FOR INSERT 
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can update hero slides" 
ON public.hero_slides 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- DELIVERY_ADDRESSES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.delivery_addresses;

CREATE POLICY "Users can view their own addresses" 
ON public.delivery_addresses 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own addresses" 
ON public.delivery_addresses 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own addresses" 
ON public.delivery_addresses 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own addresses" 
ON public.delivery_addresses 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins can manage all profiles " ON public.profiles;
DROP POLICY IF EXISTS "User can insert own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles " ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profiles " ON public.profiles;

CREATE POLICY "Superadmins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "User can insert own profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profiles" 
ON public.profiles 
FOR UPDATE 
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own profiles" 
ON public.profiles 
FOR DELETE 
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- CITIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins can delete cities" ON public.cities;
DROP POLICY IF EXISTS "Superadmin can insert cities " ON public.cities;
DROP POLICY IF EXISTS "Superadmins can update cities" ON public.cities;

CREATE POLICY "Superadmins can delete cities" 
ON public.cities 
FOR DELETE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmin can insert cities" 
ON public.cities 
FOR INSERT 
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can update cities" 
ON public.cities 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Superadmins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Superadmins can insert categories" ON public.categories;

CREATE POLICY "Superadmins can update categories" 
ON public.categories 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can delete categories" 
ON public.categories 
FOR DELETE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- MPESA_PAYMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users view own payments" ON public.mpesa_payments;
DROP POLICY IF EXISTS "Superadmins view all payments" ON public.mpesa_payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.mpesa_payments;

CREATE POLICY "Users view own payments" 
ON public.mpesa_payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.order_id = mpesa_payments.order_id 
  AND orders.user_id = (SELECT auth.uid())
));

CREATE POLICY "Superadmins view all payments" 
ON public.mpesa_payments 
FOR SELECT 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Service role can manage payments" 
ON public.mpesa_payments 
FOR ALL 
USING ((SELECT current_setting('role', true)) = 'service_role')
WITH CHECK ((SELECT current_setting('role', true)) = 'service_role');

-- ============================================================================
-- CATEGORY_ICONS TABLE (Also fix multiple permissive policies)
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.category_icons;
DROP POLICY IF EXISTS "Allow superadmins users to manage" ON public.category_icons;

-- Consolidated policy: public read OR superadmin manage
CREATE POLICY "Public read and superadmin manage category icons" 
ON public.category_icons 
FOR ALL 
USING (true OR has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
USING (is_any_admin((SELECT auth.uid())))
WITH CHECK (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
USING (is_any_admin((SELECT auth.uid())));

-- ============================================================================
-- PRODUCT_VARIANTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can delete product variants" ON public.product_variants;

CREATE POLICY "Admins can insert product variants" 
ON public.product_variants 
FOR INSERT 
WITH CHECK (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update product variants" 
ON public.product_variants 
FOR UPDATE 
USING (is_any_admin((SELECT auth.uid())))
WITH CHECK (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete product variants" 
ON public.product_variants 
FOR DELETE 
USING (is_any_admin((SELECT auth.uid())));

-- ============================================================================
-- COUNTIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins can insert counties" ON public.counties;
DROP POLICY IF EXISTS "Superadmin can update counties " ON public.counties;
DROP POLICY IF EXISTS "Superadmins can delete counties" ON public.counties;

CREATE POLICY "Superadmins can insert counties" 
ON public.counties 
FOR INSERT 
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmin can update counties" 
ON public.counties 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can delete counties" 
ON public.counties 
FOR DELETE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- USER_ROLES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;

CREATE POLICY "Superadmins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- ADMIN_SETTINGS TABLE (Also fix multiple permissive policies)
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins can manage admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Users can see settings" ON public.admin_settings;

-- Consolidated policy for SELECT
CREATE POLICY "Everyone can view admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (true);

-- Superadmin only for modifications
CREATE POLICY "Superadmins can modify admin settings" 
ON public.admin_settings 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- DAILY_SALES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins only" ON public.daily_sales;

CREATE POLICY "Superadmins only" 
ON public.daily_sales 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- STORE TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins only store" ON public.store;

CREATE POLICY "Superadmins only store" 
ON public.store 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================================================
-- CALLBACK_IP_WHITELIST TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Superadmins only callback" ON public.callback_ip_whitelist;

CREATE POLICY "Superadmins only callback" 
ON public.callback_ip_whitelist 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));