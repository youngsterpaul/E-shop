-- Fix Critical Security Issue: Order Status State Machine Validation
-- This migration adds proper order status validation and audit trail

-- 1. Create enum for order status
CREATE TYPE public.order_status_enum AS ENUM (
  'pending',
  'processing', 
  'paid',
  'packed',
  'shipped',
  'delivered',
  'cancelled'
);

-- 2. Create order status history audit table
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_reason TEXT,
  metadata JSONB,
  CONSTRAINT valid_status_change CHECK (old_status != new_status)
);

-- Enable RLS on status history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all status history
CREATE POLICY "Admins can view order status history"
ON public.order_status_history
FOR SELECT
USING (is_any_admin(auth.uid()));

-- Users can view their own order status history
CREATE POLICY "Users can view their order status history"
ON public.order_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.order_id = order_status_history.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX idx_order_status_history_changed_at ON public.order_status_history(changed_at DESC);

-- 3. Create validation function for order status transitions
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Terminal states cannot be changed
  IF OLD.status IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot change status from terminal state: %', OLD.status
      USING HINT = 'Orders in delivered or cancelled state are final';
  END IF;

  -- Define valid state transitions
  CASE OLD.status
    WHEN 'pending' THEN
      IF NEW.status NOT IN ('processing', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: pending -> %. Valid: processing, cancelled', NEW.status;
      END IF;
    
    WHEN 'processing' THEN
      IF NEW.status NOT IN ('paid', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: processing -> %. Valid: paid, cancelled', NEW.status;
      END IF;
    
    WHEN 'paid' THEN
      IF NEW.status NOT IN ('packed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: paid -> %. Valid: packed, cancelled', NEW.status;
      END IF;
    
    WHEN 'packed' THEN
      IF NEW.status NOT IN ('shipped', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: packed -> %. Valid: shipped, cancelled', NEW.status;
      END IF;
    
    WHEN 'shipped' THEN
      IF NEW.status NOT IN ('delivered', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: shipped -> %. Valid: delivered, cancelled', NEW.status;
      END IF;
    
    ELSE
      -- For any undefined status, log warning but allow
      RAISE WARNING 'Undefined status transition: % -> %', OLD.status, NEW.status;
  END CASE;

  -- Log status change to audit table
  INSERT INTO public.order_status_history (
    order_id, 
    old_status, 
    new_status, 
    changed_by,
    metadata
  ) VALUES (
    NEW.order_id,
    OLD.status,
    NEW.status,
    auth.uid(),
    jsonb_build_object(
      'user_agent', current_setting('request.headers', true)::json->>'user-agent',
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    )
  );

  RETURN NEW;
END;
$$;

-- 4. Create trigger to enforce status transitions
CREATE TRIGGER enforce_order_status_transitions
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.validate_order_status_transition();

-- 5. Create function to verify payment before marking as paid
CREATE OR REPLACE FUNCTION public.verify_payment_before_paid_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check when status is being set to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Verify that a successful M-Pesa payment exists
    IF NOT EXISTS (
      SELECT 1 
      FROM public.mpesa_payments 
      WHERE order_id = NEW.order_id 
        AND status = 'success'
        AND result_code = 0
    ) THEN
      RAISE EXCEPTION 'Cannot mark order as paid without completed M-Pesa payment'
        USING HINT = 'A successful M-Pesa payment record must exist before marking order as paid';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Create trigger to verify payment
CREATE TRIGGER verify_payment_before_paid
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION public.verify_payment_before_paid_status();

-- 7. Add webhook_secret column to orders table for M-Pesa callback validation
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Create index for webhook secret lookups
CREATE INDEX IF NOT EXISTS idx_orders_webhook_secret 
ON public.orders(webhook_secret) 
WHERE webhook_secret IS NOT NULL;