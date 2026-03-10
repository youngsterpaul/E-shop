
-- Table to persist user behavior/intent across devices
CREATE TABLE public.user_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_categories TEXT[] DEFAULT '{}',
  viewed_products TEXT[] DEFAULT '{}',
  searched_terms TEXT[] DEFAULT '{}',
  cart_product_ids TEXT[] DEFAULT '{}',
  wishlist_product_ids TEXT[] DEFAULT '{}',
  purchased_categories TEXT[] DEFAULT '{}',
  clicked_products TEXT[] DEFAULT '{}',
  preferred_brands TEXT[] DEFAULT '{}',
  dwell_time JSONB DEFAULT '{}',
  preferred_price_range JSONB DEFAULT NULL,
  session_count INTEGER DEFAULT 1,
  last_visit TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own behavior
CREATE POLICY "Users can read own behavior"
  ON public.user_behavior FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own behavior"
  ON public.user_behavior FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own behavior"
  ON public.user_behavior FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_user_behavior_updated_at
  BEFORE UPDATE ON public.user_behavior
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
