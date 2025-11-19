-- Create admin activity logs table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_name TEXT,
  old_data JSONB,
  new_data JSONB,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_admin_activity_logs_user_id ON public.admin_activity_logs(user_id);
CREATE INDEX idx_admin_activity_logs_table_name ON public.admin_activity_logs(table_name);
CREATE INDEX idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX idx_admin_activity_logs_action_type ON public.admin_activity_logs(action_type);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view activity logs
CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
TO authenticated
USING (is_any_admin(auth.uid()));

-- Function to log product changes
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_changes JSONB;
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
    LOWER(TG_OP),
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

-- Function to log order changes
CREATE OR REPLACE FUNCTION log_order_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_changes JSONB;
BEGIN
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email
  FROM profiles
  WHERE user_id = v_user_id;

  IF NOT is_any_admin(v_user_id) THEN
    RETURN COALESCE(NEW, OLD);
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
    LOWER(TG_OP),
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

-- Function to log user role changes
CREATE OR REPLACE FUNCTION log_user_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_target_email TEXT;
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

  INSERT INTO admin_activity_logs (
    user_id,
    user_email,
    action_type,
    table_name,
    record_id,
    record_name,
    old_data,
    new_data
  ) VALUES (
    v_user_id,
    v_user_email,
    LOWER(TG_OP),
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

-- Function to log category changes
CREATE OR REPLACE FUNCTION log_category_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email
  FROM profiles
  WHERE user_id = v_user_id;

  IF NOT is_any_admin(v_user_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO admin_activity_logs (
    user_id,
    user_email,
    action_type,
    table_name,
    record_id,
    record_name,
    old_data,
    new_data
  ) VALUES (
    v_user_id,
    v_user_email,
    LOWER(TG_OP),
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

-- Create triggers
DROP TRIGGER IF EXISTS trigger_log_product_changes ON products;
CREATE TRIGGER trigger_log_product_changes
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION log_product_changes();

DROP TRIGGER IF EXISTS trigger_log_order_changes ON orders;
CREATE TRIGGER trigger_log_order_changes
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_changes();

DROP TRIGGER IF EXISTS trigger_log_user_role_changes ON user_roles;
CREATE TRIGGER trigger_log_user_role_changes
AFTER INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION log_user_role_changes();

DROP TRIGGER IF EXISTS trigger_log_category_changes ON categories;
CREATE TRIGGER trigger_log_category_changes
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW
EXECUTE FUNCTION log_category_changes();