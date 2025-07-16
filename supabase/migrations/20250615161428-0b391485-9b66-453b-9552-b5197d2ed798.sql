
-- Create the cart table to manage cart sessions and states
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest users
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checkout', 'completed', 'abandoned')),
  total_amount NUMERIC(10,2) DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add cart_id to cart_items table to link items to specific carts
ALTER TABLE public.cart_items 
ADD COLUMN cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_carts_user_id ON public.carts(user_id);
CREATE INDEX idx_carts_session_id ON public.carts(session_id);
CREATE INDEX idx_carts_status ON public.carts(status);
CREATE INDEX idx_carts_expires_at ON public.carts(expires_at);
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);

-- Enable Row Level Security
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carts table
CREATE POLICY "Users can view their own carts" 
  ON public.carts 
  FOR SELECT 
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can create their own carts" 
  ON public.carts 
  FOR INSERT 
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can update their own carts" 
  ON public.carts 
  FOR UPDATE 
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can delete their own carts" 
  ON public.carts 
  FOR DELETE 
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

-- Function to update cart totals when cart items change
CREATE OR REPLACE FUNCTION update_cart_totals()
RETURNS TRIGGER AS $$
DECLARE
  cart_uuid UUID;
  total_amt NUMERIC(10,2);
  item_cnt INTEGER;
BEGIN
  -- Get cart_id from the affected row
  IF TG_OP = 'DELETE' THEN
    cart_uuid := OLD.cart_id;
  ELSE
    cart_uuid := NEW.cart_id;
  END IF;

  -- Skip if no cart_id
  IF cart_uuid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calculate new totals
  SELECT 
    COALESCE(SUM(ci.quantity * p.price), 0),
    COALESCE(SUM(ci.quantity), 0)
  INTO total_amt, item_cnt
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.product_id
  WHERE ci.cart_id = cart_uuid;

  -- Update cart totals
  UPDATE carts 
  SET 
    total_amount = total_amt,
    item_count = item_cnt,
    updated_at = NOW()
  WHERE id = cart_uuid;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for cart total updates
CREATE TRIGGER trigger_update_cart_totals_insert
  AFTER INSERT ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_totals();

CREATE TRIGGER trigger_update_cart_totals_update
  AFTER UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_totals();

CREATE TRIGGER trigger_update_cart_totals_delete
  AFTER DELETE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_totals();

-- Function to clean up expired carts
CREATE OR REPLACE FUNCTION cleanup_expired_carts()
RETURNS void AS $$
BEGIN
  -- Delete expired carts and their items (cascade will handle cart_items)
  DELETE FROM carts 
  WHERE expires_at < NOW() 
    AND status IN ('active', 'abandoned');
END;
$$ LANGUAGE plpgsql;

-- Function to create or get active cart
CREATE OR REPLACE FUNCTION get_or_create_cart(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  cart_uuid UUID;
BEGIN
  -- Try to find existing active cart
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO cart_uuid
    FROM carts
    WHERE user_id = p_user_id 
      AND status = 'active'
      AND expires_at > NOW()
    ORDER BY updated_at DESC
    LIMIT 1;
  ELSIF p_session_id IS NOT NULL THEN
    SELECT id INTO cart_uuid
    FROM carts
    WHERE session_id = p_session_id 
      AND status = 'active'
      AND expires_at > NOW()
    ORDER BY updated_at DESC
    LIMIT 1;
  END IF;

  -- Create new cart if none found
  IF cart_uuid IS NULL THEN
    INSERT INTO carts (user_id, session_id, status)
    VALUES (p_user_id, p_session_id, 'active')
    RETURNING id INTO cart_uuid;
  END IF;

  RETURN cart_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update cart status during checkout process
CREATE OR REPLACE FUNCTION update_cart_status_on_order()
RETURNS TRIGGER AS $$
DECLARE
  cart_uuid UUID;
BEGIN
  -- Find cart based on user_id and items
  IF NEW.user_id IS NOT NULL THEN
    SELECT c.id INTO cart_uuid
    FROM carts c
    WHERE c.user_id = NEW.user_id 
      AND c.status = 'active'
    ORDER BY c.updated_at DESC
    LIMIT 1;
    
    -- Update cart status to checkout when order is created
    IF cart_uuid IS NOT NULL THEN
      UPDATE carts 
      SET status = 'checkout', updated_at = NOW()
      WHERE id = cart_uuid;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update cart status when order is created
CREATE TRIGGER trigger_update_cart_on_order
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION update_cart_status_on_order();

-- Function to complete cart when payment is successful
CREATE OR REPLACE FUNCTION complete_cart_on_payment_success()
RETURNS TRIGGER AS $$
DECLARE
  cart_uuid UUID;
BEGIN
  -- When payment is successful, mark associated cart as completed
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    -- Find cart through order
    SELECT c.id INTO cart_uuid
    FROM carts c
    JOIN orders o ON o.user_id = c.user_id
    WHERE o.order_id = NEW.order_id 
      AND c.status = 'checkout'
    ORDER BY c.updated_at DESC
    LIMIT 1;
    
    IF cart_uuid IS NOT NULL THEN
      UPDATE carts 
      SET status = 'completed', updated_at = NOW()
      WHERE id = cart_uuid;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to complete cart when payment succeeds
CREATE TRIGGER trigger_complete_cart_on_payment
  AFTER UPDATE ON mpesa_payments
  FOR EACH ROW EXECUTE FUNCTION complete_cart_on_payment_success();

-- Add updated_at trigger for carts table
CREATE TRIGGER trigger_update_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
