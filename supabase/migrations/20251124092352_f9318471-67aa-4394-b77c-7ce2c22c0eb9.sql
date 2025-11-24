-- Add display_order column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Populate display_order with sequential values based on current order
WITH numbered_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as row_num
  FROM categories
)
UPDATE categories
SET display_order = numbered_categories.row_num
FROM numbered_categories
WHERE categories.id = numbered_categories.id;