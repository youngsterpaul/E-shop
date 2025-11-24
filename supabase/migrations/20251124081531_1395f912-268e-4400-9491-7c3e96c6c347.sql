-- Fix log_user_role_changes function causing 42601 errors on user_roles modifications
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
    new_data,
    changes
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