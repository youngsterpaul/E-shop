-- Add reviews_count column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0 NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_reviews_count ON products(reviews_count);

-- Function to update product reviews count
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for reviews table
DROP TRIGGER IF EXISTS trigger_update_reviews_count_on_insert ON reviews;
CREATE TRIGGER trigger_update_reviews_count_on_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_reviews_count();

DROP TRIGGER IF EXISTS trigger_update_reviews_count_on_delete ON reviews;
CREATE TRIGGER trigger_update_reviews_count_on_delete
AFTER DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_reviews_count();

DROP TRIGGER IF EXISTS trigger_update_reviews_count_on_update ON reviews;
CREATE TRIGGER trigger_update_reviews_count_on_update
AFTER UPDATE OF product_id ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_reviews_count();

-- Backfill existing review counts
UPDATE products p
SET reviews_count = (
  SELECT COUNT(*)
  FROM reviews r
  WHERE r.product_id = p.product_id
);