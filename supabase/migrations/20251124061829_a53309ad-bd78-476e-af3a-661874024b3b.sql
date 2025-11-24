-- Fix the generate_return_number function to correctly extract sequence numbers
CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
  return_number TEXT;
BEGIN
  -- Extract the last 4 digits from existing return numbers for this year
  SELECT COALESCE(MAX((SUBSTRING(return_number FROM '-(\d{4})$'))::INTEGER), 0) + 1
  INTO next_number
  FROM returns
  WHERE return_number LIKE 'RET-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%';
  
  -- Format as RET-YYYY-NNNN
  return_number := 'RET-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN return_number;
END;
$$;