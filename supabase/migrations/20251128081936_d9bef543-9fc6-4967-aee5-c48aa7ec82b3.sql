-- Update order status transition validation to allow more flexible workflow
-- while still maintaining payment verification

CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  has_payment BOOLEAN;
BEGIN
  -- Terminal states cannot be changed
  IF OLD.status IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot change status from terminal state: %', OLD.status
      USING HINT = 'Orders in delivered or cancelled state are final';
  END IF;

  -- Check if payment exists for this order
  SELECT EXISTS (
    SELECT 1 
    FROM public.mpesa_payments 
    WHERE order_id = NEW.order_id 
      AND status = 'success'
      AND result_code = 0
  ) INTO has_payment;

  CASE OLD.status
    WHEN 'pending' THEN
      IF NEW.status NOT IN ('processing', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: pending -> %. Valid: processing, cancelled', NEW.status;
      END IF;
    
    WHEN 'processing' THEN
      -- Allow processing -> packed if payment exists, otherwise require explicit paid status
      IF NEW.status = 'packed' THEN
        IF NOT has_payment THEN
          RAISE EXCEPTION 'Cannot mark order as packed without completed M-Pesa payment'
            USING HINT = 'Payment must be verified before packing. Valid transitions: paid, cancelled';
        END IF;
      ELSIF NEW.status NOT IN ('paid', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: processing -> %. Valid: paid, packed (if paid), cancelled', NEW.status;
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
      RAISE WARNING 'Undefined status transition: % -> %', OLD.status, NEW.status;
  END CASE;

  -- Log status change in history
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
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for',
      'payment_verified', has_payment
    )
  );

  RETURN NEW;
END;
$function$;