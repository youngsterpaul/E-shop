
-- Function to delete expired pending orders (older than 48 hours)
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM orders
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '48 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
