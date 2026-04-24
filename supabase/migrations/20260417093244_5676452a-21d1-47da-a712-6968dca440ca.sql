-- Fix overly permissive RLS policies

-- 1. ab_test_results: restrict INSERT to authenticated users inserting their own data or anon with session
DROP POLICY IF EXISTS "System can insert A/B test results" ON public.ab_test_results;
CREATE POLICY "Users can insert own A/B test results"
ON public.ab_test_results
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL)
);

-- 2. discount_usage: restrict INSERT to authenticated users for their own usage
DROP POLICY IF EXISTS "System can insert discount usage" ON public.discount_usage;
CREATE POLICY "Users can insert own discount usage"
ON public.discount_usage
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. login_audit: drop overly permissive policy (now handled via edge function with service role)
DROP POLICY IF EXISTS "Anyone can insert login audits" ON public.login_audit;

-- 4. newsletter_subscribers: keep public but require non-empty email and active subscription
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) > 3
  AND length(email) <= 320
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND is_active = true
  AND unsubscribed_at IS NULL
);

-- 5. role_change_history: only superadmins can insert (history should normally be written by triggers/edge functions)
DROP POLICY IF EXISTS "Service role can insert role history" ON public.role_change_history;
CREATE POLICY "Superadmins can insert role history"
ON public.role_change_history
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- 6. session_activity: scope to current user/session
DROP POLICY IF EXISTS "session_activity_insert_policy" ON public.session_activity;
DROP POLICY IF EXISTS "session_activity_update_policy" ON public.session_activity;
DROP POLICY IF EXISTS "session_activity_delete_policy" ON public.session_activity;

CREATE POLICY "session_activity_insert_policy"
ON public.session_activity
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "session_activity_update_policy"
ON public.session_activity
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "session_activity_delete_policy"
ON public.session_activity
FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

-- 7. Restrict storage.objects SELECT on public buckets to direct object access only (no listing)
-- Drop overly broad public listing policies and replace with object-only access
DROP POLICY IF EXISTS "Public read access 1mc07p_0" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own reviews y5j7e7_0" ON storage.objects;

-- Note: Public buckets serve files via CDN URLs without needing storage.objects SELECT.
-- We omit broad SELECT policies to prevent listing. Direct object URLs continue to work.
-- Re-create the upload policy for review-media (it was misnamed as a SELECT)
CREATE POLICY "Users can upload their own review media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
