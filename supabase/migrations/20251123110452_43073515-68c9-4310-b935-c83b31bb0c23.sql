-- Create discounts/coupons table
CREATE TABLE IF NOT EXISTS public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_purchase_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_products', 'specific_categories')),
  product_ids UUID[],
  category_ids INTEGER[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create discount usage tracking table
CREATE TABLE IF NOT EXISTS public.discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID REFERENCES public.discounts(id) ON DELETE CASCADE,
  user_id UUID,
  order_id TEXT,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON public.discounts(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_discount_usage_discount_id ON public.discount_usage(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user_id ON public.discount_usage(user_id);

-- RLS Policies for discounts
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discounts"
  ON public.discounts FOR SELECT
  USING (is_active = true AND start_date <= NOW() AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Admins can manage discounts"
  ON public.discounts FOR ALL
  USING (is_any_admin(auth.uid()))
  WITH CHECK (is_any_admin(auth.uid()));

-- RLS Policies for discount_usage
ALTER TABLE public.discount_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own discount usage"
  ON public.discount_usage FOR SELECT
  USING (auth.uid() = user_id OR is_any_admin(auth.uid()));

CREATE POLICY "System can insert discount usage"
  ON public.discount_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all discount usage"
  ON public.discount_usage FOR ALL
  USING (is_any_admin(auth.uid()));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_discount_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discount_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_updated_at();