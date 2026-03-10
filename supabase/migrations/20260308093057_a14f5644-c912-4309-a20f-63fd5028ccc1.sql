
-- Back-in-stock notification subscriptions
CREATE TABLE public.stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  email TEXT,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ,
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own stock notifications"
  ON public.stock_notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all stock notifications"
  ON public.stock_notifications FOR SELECT
  TO authenticated
  USING (is_any_admin(auth.uid()));

CREATE INDEX idx_stock_notifications_product ON public.stock_notifications(product_id, notified);
