
-- Function to automatically update daily_sales when an order is paid/completed
CREATE OR REPLACE FUNCTION public.update_daily_sales_on_order_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_date DATE;
  day_revenue NUMERIC;
  day_orders INTEGER;
  day_customers INTEGER;
BEGIN
  -- Determine which date to update based on the order's created_at
  order_date := DATE(COALESCE(NEW.created_at, OLD.created_at));

  -- Calculate daily totals for that date
  -- Count orders that are in a "paid/completed" state
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*),
    COUNT(DISTINCT user_id)
  INTO day_revenue, day_orders, day_customers
  FROM orders
  WHERE DATE(created_at) = order_date
    AND status IN ('processing', 'packed', 'shipped', 'delivered');

  -- Upsert into daily_sales
  INSERT INTO daily_sales (date, total_revenue, total_orders, total_customers)
  VALUES (order_date, day_revenue, day_orders, day_customers)
  ON CONFLICT (date) 
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_orders = EXCLUDED.total_orders,
    total_customers = EXCLUDED.total_customers;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add unique constraint on date if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_sales_date_key'
  ) THEN
    ALTER TABLE public.daily_sales ADD CONSTRAINT daily_sales_date_key UNIQUE (date);
  END IF;
END $$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_update_daily_sales ON public.orders;
CREATE TRIGGER trigger_update_daily_sales
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_sales_on_order_change();

-- Backfill: Populate daily_sales from existing orders
INSERT INTO daily_sales (date, total_revenue, total_orders, total_customers)
SELECT 
  DATE(created_at) as order_date,
  COALESCE(SUM(amount), 0) as total_revenue,
  COUNT(*) as total_orders,
  COUNT(DISTINCT user_id) as total_customers
FROM orders
WHERE status IN ('processing', 'packed', 'shipped', 'delivered')
GROUP BY DATE(created_at)
ON CONFLICT (date) 
DO UPDATE SET
  total_revenue = EXCLUDED.total_revenue,
  total_orders = EXCLUDED.total_orders,
  total_customers = EXCLUDED.total_customers;
