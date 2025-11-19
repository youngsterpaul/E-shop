-- Fix search_path security issue for generate_po_number function
DROP FUNCTION IF EXISTS public.generate_po_number();

CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  po_number TEXT;
BEGIN
  -- Get the next PO number
  SELECT COALESCE(MAX(SUBSTRING(po_number FROM 'PO-(\d+)')::INTEGER), 0) + 1
  INTO next_number
  FROM purchase_orders
  WHERE po_number LIKE 'PO-%';
  
  -- Format as PO-YYYY-NNNN
  po_number := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN po_number;
END;
$$;