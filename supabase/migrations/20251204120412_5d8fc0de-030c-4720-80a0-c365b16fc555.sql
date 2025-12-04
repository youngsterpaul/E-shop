-- Fix testimonials policies - wrap auth.uid() in SELECT
DROP POLICY IF EXISTS "View testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can insert testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can delete testimonials" ON public.testimonials;

CREATE POLICY "View testimonials" ON public.testimonials
FOR SELECT USING (
  is_active = true OR is_any_admin((SELECT auth.uid()))
);

CREATE POLICY "Admins can insert testimonials" ON public.testimonials
FOR INSERT WITH CHECK (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update testimonials" ON public.testimonials
FOR UPDATE USING (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete testimonials" ON public.testimonials
FOR DELETE USING (is_any_admin((SELECT auth.uid())));

-- Fix admin_settings policy
DROP POLICY IF EXISTS "View admin settings" ON public.admin_settings;

CREATE POLICY "View admin settings" ON public.admin_settings
FOR SELECT USING (
  (setting_key)::text = 'popular_searches'::text OR 
  is_any_admin((SELECT auth.uid()))
);

-- Fix newsletter_subscribers policies
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can delete subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Admins can view all subscribers" ON public.newsletter_subscribers
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'superadmin') OR 
  has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers
FOR DELETE USING (
  has_role((SELECT auth.uid()), 'superadmin') OR 
  has_role((SELECT auth.uid()), 'admin')
);