-- Add display_order column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

-- Update existing products with sequential display_order based on created_at
UPDATE products 
SET display_order = subquery.row_num 
FROM (
  SELECT product_id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num 
  FROM products
) AS subquery 
WHERE products.product_id = subquery.product_id;