-- Fix auth_rls_initplan warnings on newsletter_subscribers
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can delete subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Admins can view all subscribers" ON public.newsletter_subscribers
FOR SELECT USING (
  (SELECT has_role(auth.uid(), 'superadmin')) OR 
  (SELECT has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers
FOR DELETE USING (
  (SELECT has_role(auth.uid(), 'superadmin')) OR 
  (SELECT has_role(auth.uid(), 'admin'))
);

-- Fix auth_rls_initplan and multiple_permissive_policies on testimonials
DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Anyone can view active testimonials" ON public.testimonials;

-- Consolidated SELECT policy for testimonials
CREATE POLICY "View testimonials" ON public.testimonials
FOR SELECT USING (
  is_active = true OR (SELECT is_any_admin(auth.uid()))
);

-- Admin management policies with proper auth wrapping
CREATE POLICY "Admins can insert testimonials" ON public.testimonials
FOR INSERT WITH CHECK ((SELECT is_any_admin(auth.uid())));

CREATE POLICY "Admins can update testimonials" ON public.testimonials
FOR UPDATE USING ((SELECT is_any_admin(auth.uid())));

CREATE POLICY "Admins can delete testimonials" ON public.testimonials
FOR DELETE USING ((SELECT is_any_admin(auth.uid())));

-- Fix multiple_permissive_policies on admin_settings
DROP POLICY IF EXISTS "Admins can view admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Everyone can view popular_searches setting" ON public.admin_settings;

-- Consolidated SELECT policy for admin_settings
CREATE POLICY "View admin settings" ON public.admin_settings
FOR SELECT USING (
  (setting_key)::text = 'popular_searches'::text OR 
  (SELECT is_any_admin(auth.uid()))
);