-- Fix search path security issue for the function
CREATE OR REPLACE FUNCTION update_product_reviews_count()
RETURNS TRIGGER AS $$
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
    -- If product_id changes, update both products
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;