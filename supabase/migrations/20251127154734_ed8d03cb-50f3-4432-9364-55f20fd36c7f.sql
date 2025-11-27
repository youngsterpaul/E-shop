-- Fix Function Search Path Mutable warning
-- Update all custom functions to set search_path = public

-- Functions that need search_path set (recreating with proper security)

CREATE OR REPLACE FUNCTION public.update_discount_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM session_activity 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE delivery_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_number INTEGER;
  po_number TEXT;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(po_number FROM 'PO-(\d+)')::INTEGER), 0) + 1
  INTO next_number
  FROM purchase_orders
  WHERE po_number LIKE 'PO-%';
  
  po_number := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN po_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_product_reviews_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET reviews_count = reviews_count + 1
    WHERE product_id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET reviews_count = GREATEST(reviews_count - 1, 0)
    WHERE product_id = OLD.product_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND OLD.product_id != NEW.product_id THEN
    UPDATE products 
    SET reviews_count = GREATEST(reviews_count - 1, 0)
    WHERE product_id = OLD.product_id;
    
    UPDATE products 
    SET reviews_count = reviews_count + 1
    WHERE product_id = NEW.product_id;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF OLD.status IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot change status from terminal state: %', OLD.status
      USING HINT = 'Orders in delivered or cancelled state are final';
  END IF;

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
      RAISE WARNING 'Undefined status transition: % -> %', OLD.status, NEW.status;
  END CASE;

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
$function$;

CREATE OR REPLACE FUNCTION public.verify_payment_before_paid_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
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
$function$;

CREATE OR REPLACE FUNCTION public.update_user_last_sign_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE public.profiles
    SET last_sign_in_at = NEW.last_sign_in_at
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.reviews
    SET helpful_count = (
      SELECT COUNT(*) 
      FROM public.review_votes 
      WHERE review_id = NEW.review_id AND vote_type = 'helpful'
    )
    WHERE review_id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews
    SET helpful_count = (
      SELECT COUNT(*) 
      FROM public.review_votes 
      WHERE review_id = OLD.review_id AND vote_type = 'helpful'
    )
    WHERE review_id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_po_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_stock_on_po_receive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'received' AND OLD.status != 'received' THEN
    UPDATE products p
    SET stock = stock + poi.received_quantity,
        updated_at = now()
    FROM purchase_order_items poi
    WHERE poi.purchase_order_id = NEW.id
    AND p.product_id = poi.product_id
    AND poi.received_quantity > 0;
    
    NEW.actual_delivery_date := now();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TABLE(product_id uuid, product_name text, current_stock integer, reorder_point integer, preferred_supplier_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.product_id,
    p.name,
    p.stock,
    p.reorder_point,
    s.name as preferred_supplier_name
  FROM products p
  LEFT JOIN suppliers s ON p.preferred_supplier_id = s.id
  WHERE p.stock <= p.reorder_point
  AND p.reorder_point IS NOT NULL
  ORDER BY (p.reorder_point - p.stock) DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := 'REF' || UPPER(substring(md5(random()::text || user_id_param::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.award_purchase_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  points_to_award integer;
  user_uuid uuid;
BEGIN
  points_to_award := FLOOR(NEW.amount / 100);
  user_uuid := NEW.user_id;
  
  IF user_uuid IS NOT NULL AND NEW.status = 'delivered' AND points_to_award > 0 THEN
    INSERT INTO public.loyalty_points (user_id, points, total_earned)
    VALUES (user_uuid, points_to_award, points_to_award)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      points = public.loyalty_points.points + points_to_award,
      total_earned = public.loyalty_points.total_earned + points_to_award,
      updated_at = now();
    
    INSERT INTO public.points_transactions (user_id, points, transaction_type, source, reference_id, description)
    VALUES (user_uuid, points_to_award, 'earn', 'purchase', NEW.order_id, 'Points earned from order ' || NEW.order_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.award_review_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  points_to_award integer := 10;
BEGIN
  INSERT INTO public.loyalty_points (user_id, points, total_earned)
  VALUES (NEW.user_id, points_to_award, points_to_award)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points = public.loyalty_points.points + points_to_award,
    total_earned = public.loyalty_points.total_earned + points_to_award,
    updated_at = now();
  
  INSERT INTO public.points_transactions (user_id, points, transaction_type, source, reference_id, description)
  VALUES (NEW.user_id, points_to_award, 'earn', 'review', NEW.review_id::text, 'Points earned for writing a review');
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_number INTEGER;
  new_return_number TEXT;
BEGIN
  SELECT COALESCE(MAX((SUBSTRING(returns.return_number FROM '-(\d{4})$'))::INTEGER), 0) + 1
  INTO next_number
  FROM returns
  WHERE returns.return_number LIKE 'RET-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%';
  
  new_return_number := 'RET-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_return_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_user_review_product(p_user_id uuid, p_product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.orders o
        JOIN public.order_items oi ON o.order_id = oi.order_id
        WHERE o.user_id = p_user_id 
        AND oi.product_id = p_product_id
        AND o.status = 'delivered'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.profiles (
        user_id,
        email,
        first_name,
        last_name,
        phone,
        avatar_url,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        NEW.last_sign_in_at,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admin_no_reply(user_message_id uuid, user_id uuid, message_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message)
    SELECT user_id, 'chat_no_reply', 'Manual Response Needed', 
           'User message: ' || message_text
    FROM public.profiles
    WHERE is_admin = true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_migrate_guest_cart()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  session_id_val TEXT;
BEGIN
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_carts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cart_items 
  WHERE cart_id IN (
    SELECT id FROM carts 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND status != 'completed'
  );
  
  DELETE FROM carts 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW()
  AND status != 'completed';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_cart_migration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  session_id_val TEXT;
BEGIN
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE public.profiles
    SET
        email = NEW.email,
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, phone),
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
        updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_cart_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    RAISE NOTICE 'Trigger fired for % on cart_id: %, product_id: %, quantity: %', 
      TG_OP, NEW.cart_id, NEW.product_id, NEW.quantity;
    PERFORM update_cart_totals(NEW.cart_id);
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RAISE NOTICE 'Trigger fired for % on cart_id: %, product_id: %', 
      TG_OP, OLD.cart_id, OLD.product_id;
    PERFORM update_cart_totals(OLD.cart_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_cart_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE carts 
  SET 
    item_count = (
      SELECT COALESCE(SUM(quantity), 0) 
      FROM cart_items 
      WHERE cart_items.cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
    ),
    total_amount = (
      SELECT COALESCE(SUM(p.price * ci.quantity), 0.00)
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_order_first_name(order_id integer, first_name character varying)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE orders 
    SET first_name = update_order_first_name.first_name,
        updated_at = NOW()
    WHERE order_id = update_order_first_name.order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;