-- Align admin_activity_logs.action_type with CHECK constraint (create/update/delete)
-- Update all logging functions to map TG_OP to these values

CREATE OR REPLACE FUNCTION public.log_product_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_changes JSONB;
  v_action_type TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get user email from profiles
  SELECT email INTO v_user_email
  FROM profiles
  WHERE user_id = v_user_id;

  -- Only log if user is an admin
  IF NOT is_any_admin(v_user_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Map trigger operation to allowed action_type values
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'delete';
  ELSE
    v_action_type := LOWER(TG_OP);
  END IF;

  -- Calculate changes for updates
  IF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object(
      'name', CASE WHEN OLD.name != NEW.name THEN jsonb_build_object('old', OLD.name, 'new', NEW.name) ELSE NULL END,
      'price', CASE WHEN OLD.price != NEW.price THEN jsonb_build_object('old', OLD.price, 'new', NEW.price) ELSE NULL END,
      'stock', CASE WHEN OLD.stock != NEW.stock THEN jsonb_build_object('old', OLD.stock, 'new', NEW.stock) ELSE NULL END,
      'categories', CASE WHEN OLD.categories != NEW.categories THEN jsonb_build_object('old', OLD.categories, 'new', NEW.categories) ELSE NULL END,
      'featured', CASE WHEN OLD.featured != NEW.featured THEN jsonb_build_object('old', OLD.featured, 'new', NEW.featured) ELSE NULL END
    );
    -- Remove null changes
    v_changes := (SELECT jsonb_object_agg(key, value) FROM jsonb_each(v_changes) WHERE value IS NOT NULL);
  END IF;

  -- Insert activity log
  INSERT INTO admin_activity_logs (
    user_id,
    user_email,
    action_type,
    table_name,
    record_id,
    record_name,
    old_data,
    new_data,
    changes
  ) VALUES (
    v_user_id,
    v_user_email,
    v_action_type,
    'products',
    COALESCE(NEW.product_id::TEXT, OLD.product_id::TEXT),
    COALESCE(NEW.name, OLD.name),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_changes
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_order_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_changes JSONB;
  v_action_type TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email
  FROM profiles
  WHERE user_id = v_user_id;

  IF NOT is_any_admin(v_user_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Map trigger operation to allowed action_type values
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'delete';
  ELSE
    v_action_type := LOWER(TG_OP);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_changes := jsonb_build_object(
      'status', CASE WHEN OLD.status != NEW.status THEN jsonb_build_object('old', OLD.status, 'new', NEW.status) ELSE NULL END,
      'tracking_number', CASE WHEN OLD.tracking_number != NEW.tracking_number THEN jsonb_build_object('old', OLD.tracking_number, 'new', NEW.tracking_number) ELSE NULL END,
      'amount', CASE WHEN OLD.amount != NEW.amount THEN jsonb_build_object('old', OLD.amount, 'new', NEW.amount) ELSE NULL END
    );
    v_changes := (SELECT jsonb_object_agg(key, value) FROM jsonb_each(v_changes) WHERE value IS NOT NULL);
  END IF;

  INSERT INTO admin_activity_logs (
    user_id,
    user_email,
    action_type,
    table_name,
    record_id,
    record_name,
    old_data,
    new_data,
    changes
  ) VALUES (
    v_user_id,
    v_user_email,
    v_action_type,
    'orders',
    COALESCE(NEW.order_id, OLD.order_id),
    'Order #' || SUBSTRING(COALESCE(NEW.order_id, OLD.order_id), 1, 8),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_changes
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_category_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_action_type TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email
  FROM profiles
  WHERE user_id = v_user_id;

  IF NOT is_any_admin(v_user_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Map trigger operation to allowed action_type values
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'delete';
  ELSE
    v_action_type := LOWER(TG_OP);
  END IF;

  INSERT INTO admin_activity_logs (
    user_id,
    user_email,
    action_type,
    table_name,
    record_id,
    record_name,
    old_data,
    new_data,
    changes
  ) VALUES (
    v_user_id,
    v_user_email,
    v_action_type,
    'categories',
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    COALESCE(NEW.category, OLD.category),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    NULL
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_user_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_target_email TEXT;
  v_action_type TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email
  FROM profiles
  WHERE user_id = v_user_id;

  SELECT email INTO v_target_email
  FROM profiles
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  IF NOT is_any_admin(v_user_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Map trigger operation to allowed action_type values
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'delete';
  ELSE
    v_action_type := LOWER(TG_OP);
  END IF;

  INSERT INTO admin_activity_logs (
    user_id,
    user_email,
    action_type,
    table_name,
    record_id,
    record_name,
    old_data,
    new_data,
    changes
  ) VALUES (
    v_user_id,
    v_user_email,
    v_action_type,
    'user_roles',
    COALESCE(NEW.user_id::TEXT, OLD.user_id::TEXT),
    v_target_email || ' - ' || COALESCE(NEW.role::TEXT, OLD.role::TEXT),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    NULL
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;