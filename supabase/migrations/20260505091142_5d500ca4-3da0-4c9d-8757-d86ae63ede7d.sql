
-- 1. Drop overly permissive storage upload policies (admins/moderators retain access via existing policies)
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload 1mc07p_0" ON storage.objects;

-- 2. Revoke EXECUTE on internal SECURITY DEFINER functions from anon and authenticated.
-- Keep has_role / is_any_admin / has_route_permission callable by authenticated since RLS policies depend on them.
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid)             FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code(uuid)         FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.migrate_guest_cart_to_user(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_or_create_cart(uuid, text)       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_user_review_product(uuid, uuid)  FROM anon, authenticated;

-- has_role/is_any_admin/has_route_permission: revoke from anon, keep for authenticated (used inside RLS as the executing role)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)             FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_any_admin(uuid)                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_route_permission(uuid, text)     FROM anon;

-- 3. Newsletter subscribers: ensure no UPDATE/DELETE paths are exposed to clients.
-- (Keep existing admin SELECT + public INSERT policies; explicitly deny client UPDATE/DELETE.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='newsletter_subscribers'
      AND policyname='No client updates to subscribers'
  ) THEN
    CREATE POLICY "No client updates to subscribers"
      ON public.newsletter_subscribers
      FOR UPDATE TO anon, authenticated
      USING (false) WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='newsletter_subscribers'
      AND policyname='No client deletes of subscribers'
  ) THEN
    CREATE POLICY "No client deletes of subscribers"
      ON public.newsletter_subscribers
      FOR DELETE TO anon, authenticated
      USING (false);
  END IF;
END $$;

-- 4. Realtime cart leak: remove cart_items from realtime publication so guest carts cannot be subscribed to by other sessions.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='cart_items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.cart_items';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='carts'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.carts';
  END IF;
END $$;
