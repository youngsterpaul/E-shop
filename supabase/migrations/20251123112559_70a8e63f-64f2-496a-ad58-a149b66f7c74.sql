-- Create returns table
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number VARCHAR(50) UNIQUE NOT NULL,
  order_id TEXT NOT NULL REFERENCES public.orders(order_id),
  user_id UUID REFERENCES public.profiles(user_id),
  items JSONB NOT NULL,
  return_reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'completed')),
  refund_amount NUMERIC,
  refund_method VARCHAR(20) CHECK (refund_method IN ('original_payment', 'store_credit', 'bank_transfer')),
  tracking_number VARCHAR(100),
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(user_id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_returns_order_id ON public.returns(order_id);
CREATE INDEX idx_returns_user_id ON public.returns(user_id);
CREATE INDEX idx_returns_status ON public.returns(status);
CREATE INDEX idx_returns_created_at ON public.returns(created_at DESC);

-- Enable RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own returns"
  ON public.returns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create returns"
  ON public.returns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all returns"
  ON public.returns
  FOR SELECT
  USING (is_any_admin(auth.uid()));

CREATE POLICY "Admins can update returns"
  ON public.returns
  FOR UPDATE
  USING (is_any_admin(auth.uid()))
  WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can delete returns"
  ON public.returns
  FOR DELETE
  USING (is_any_admin(auth.uid()));

-- Trigger to update updated_at
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  return_number TEXT;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(return_number FROM 'RET-(\d+)')::INTEGER), 0) + 1
  INTO next_number
  FROM returns
  WHERE return_number LIKE 'RET-%';
  
  return_number := 'RET-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN return_number;
END;
$$;