
-- 1) Discounts: restrict active discount visibility to authenticated users
DROP POLICY IF EXISTS "View active discounts" ON public.discounts;
CREATE POLICY "View active discounts"
  ON public.discounts
  FOR SELECT
  TO authenticated
  USING (
    (
      is_active = true
      AND start_date <= now()
      AND (end_date IS NULL OR end_date >= now())
    )
    OR public.is_any_admin((SELECT auth.uid()))
  );

-- 2) Storage: review-media DELETE/UPDATE must be folder-scoped to owner
DROP POLICY IF EXISTS "Users delete own review media" ON storage.objects;
DROP POLICY IF EXISTS "Users update own review media" ON storage.objects;

CREATE POLICY "Users delete own review media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'review-media'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own review media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'review-media'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'review-media'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 3) Realtime: remove sensitive tables from public realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.security_alerts;

-- Enforce channel-level authorization on realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to subscribe only to:
--   * chat:<their-own-uid>   (their personal chat channel)
--   * admin-chat:*           (admins only)
DROP POLICY IF EXISTS "Authenticated can read own realtime channels" ON realtime.messages;
CREATE POLICY "Authenticated can read own realtime channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    (
      realtime.topic() = ('chat:' || (auth.uid())::text)
    )
    OR (
      realtime.topic() LIKE 'admin-chat:%'
      AND public.is_any_admin(auth.uid())
    )
    OR (
      -- Generic resource topics (products/cart) that don't carry personal data
      realtime.topic() LIKE 'products:%'
      OR realtime.topic() LIKE 'cart:%'
    )
  );

-- 4) Revoke public execution on internal SECURITY DEFINER helpers/triggers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_update() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_last_sign_in() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_migrate_guest_cart() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_cart_migration() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_purchase_points() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_review_points() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_address() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_category_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_order_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_product_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_user_role_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_daily_sales_on_order_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_discount_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_update_cart_totals() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_cart_totals() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_po_total() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_reviews_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_review_helpful_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_stock_on_po_receive() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order_status_transition() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_payment_before_paid_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_no_reply(uuid, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_carts() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otps() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_pending_orders() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_sessions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_low_stock() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_po_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_return_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_order_first_name(integer, varchar) FROM anon, authenticated;
