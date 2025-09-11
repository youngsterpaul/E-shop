-- SECURITY FIX: Update remaining database functions to have proper search_path settings
-- This addresses the security warnings about mutable search_path in functions

-- Update cleanup_expired_carts function
CREATE OR REPLACE FUNCTION public.cleanup_expired_carts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete cart_items first (cascade will handle this, but being explicit)
  DELETE FROM cart_items 
  WHERE cart_id IN (
    SELECT id FROM carts 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND status != 'completed'
  );
  
  -- Delete expired carts
  DELETE FROM carts 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW()
  AND status != 'completed';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- Update trigger_update_cart_totals function  
CREATE OR REPLACE FUNCTION public.trigger_update_cart_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    RAISE NOTICE 'Trigger fired for % on cart_id: %, product_id: %, quantity: %', 
      TG_OP, NEW.cart_id, NEW.product_id, NEW.quantity;
    PERFORM update_cart_totals(NEW.cart_id);
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    RAISE NOTICE 'Trigger fired for % on cart_id: %, product_id: %', 
      TG_OP, OLD.cart_id, OLD.product_id;
    PERFORM update_cart_totals(OLD.cart_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Update notify_admin_no_reply function
CREATE OR REPLACE FUNCTION public.notify_admin_no_reply(user_message_id uuid, user_id uuid, message_text text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message)
    SELECT user_id, 'chat_no_reply', 'Manual Response Needed', 
           'User message: ' || message_text
    FROM public.profiles
    WHERE is_admin = true;
END;
$function$;