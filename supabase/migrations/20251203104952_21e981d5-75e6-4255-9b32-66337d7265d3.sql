-- Fix RLS Performance Issues: auth_rls_initplan and multiple_permissive_policies

-- ============================================
-- 1. Fix user_mfa_settings
-- ============================================
DROP POLICY IF EXISTS "Users can manage own MFA settings" ON public.user_mfa_settings;
CREATE POLICY "Users can manage own MFA settings" ON public.user_mfa_settings
FOR ALL USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- 2. Fix contact_settings (auth_rls_initplan)
-- ============================================
DROP POLICY IF EXISTS "Superadmins can insert contact settings" ON public.contact_settings;
DROP POLICY IF EXISTS "Superadmins can update contact settings" ON public.contact_settings;
DROP POLICY IF EXISTS "Superadmins can delete contact settings" ON public.contact_settings;

CREATE POLICY "Superadmins can insert contact settings" ON public.contact_settings
FOR INSERT WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can update contact settings" ON public.contact_settings
FOR UPDATE USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can delete contact settings" ON public.contact_settings
FOR DELETE USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

-- ============================================
-- 3. Fix job_listings (auth_rls_initplan)
-- ============================================
DROP POLICY IF EXISTS "Everyone can view active jobs" ON public.job_listings;
DROP POLICY IF EXISTS "Admins can insert jobs" ON public.job_listings;
DROP POLICY IF EXISTS "Admins can update jobs" ON public.job_listings;
DROP POLICY IF EXISTS "Admins can delete jobs" ON public.job_listings;

CREATE POLICY "Everyone can view active jobs" ON public.job_listings
FOR SELECT USING ((is_active = true) OR is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can insert jobs" ON public.job_listings
FOR INSERT WITH CHECK (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update jobs" ON public.job_listings
FOR UPDATE USING (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete jobs" ON public.job_listings
FOR DELETE USING (is_any_admin((SELECT auth.uid())));

-- ============================================
-- 4. Fix faq_items (consolidate + fix auth)
-- ============================================
DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faq_items;
DROP POLICY IF EXISTS "Anyone can view active FAQs" ON public.faq_items;

-- Single consolidated SELECT policy
CREATE POLICY "View FAQs" ON public.faq_items
FOR SELECT USING ((is_active = true) OR is_any_admin((SELECT auth.uid())));

-- Separate policies for INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert FAQs" ON public.faq_items
FOR INSERT WITH CHECK (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update FAQs" ON public.faq_items
FOR UPDATE USING (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete FAQs" ON public.faq_items
FOR DELETE USING (is_any_admin((SELECT auth.uid())));

-- ============================================
-- 5. Fix email_verifications (consolidate + fix auth)
-- ============================================
DROP POLICY IF EXISTS "Users can only read their own verification by email" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can read own verifications" ON public.email_verifications;

-- Single consolidated SELECT policy (public read needed for OTP verification flow)
CREATE POLICY "Read email verifications" ON public.email_verifications
FOR SELECT USING (true);

-- ============================================
-- 6. Fix admin_settings (consolidate + fix auth)
-- ============================================
DROP POLICY IF EXISTS "Only admins can view admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "View admin settings" ON public.admin_settings;

-- Single consolidated SELECT policy - admins only
CREATE POLICY "Admins can view admin settings" ON public.admin_settings
FOR SELECT USING (is_any_admin((SELECT auth.uid())));

-- ============================================
-- 7. Fix site_content (consolidate + fix auth)
-- ============================================
DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;
DROP POLICY IF EXISTS "Anyone can view active site content" ON public.site_content;

-- Single consolidated SELECT policy
CREATE POLICY "View site content" ON public.site_content
FOR SELECT USING ((is_active = true) OR is_any_admin((SELECT auth.uid())));

-- Separate policies for INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert site content" ON public.site_content
FOR INSERT WITH CHECK (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update site content" ON public.site_content
FOR UPDATE USING (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete site content" ON public.site_content
FOR DELETE USING (is_any_admin((SELECT auth.uid())));

-- ============================================
-- 8. Fix admin_route_permissions (consolidate)
-- ============================================
DROP POLICY IF EXISTS "Admins can view route permissions" ON public.admin_route_permissions;
DROP POLICY IF EXISTS "Superadmins can manage route permissions" ON public.admin_route_permissions;

-- Single consolidated SELECT policy
CREATE POLICY "View route permissions" ON public.admin_route_permissions
FOR SELECT USING (is_any_admin((SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'moderator'::app_role));

-- Superadmin-only for modifications
CREATE POLICY "Superadmins can insert route permissions" ON public.admin_route_permissions
FOR INSERT WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can update route permissions" ON public.admin_route_permissions
FOR UPDATE USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can delete route permissions" ON public.admin_route_permissions
FOR DELETE USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));