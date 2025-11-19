-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  total_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase order items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add reorder point to products table if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS preferred_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON public.suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON public.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON public.purchase_order_items(product_id);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Admins can view suppliers"
ON public.suppliers FOR SELECT
TO authenticated
USING (is_any_admin(auth.uid()));

CREATE POLICY "Admins can insert suppliers"
ON public.suppliers FOR INSERT
TO authenticated
WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can update suppliers"
ON public.suppliers FOR UPDATE
TO authenticated
USING (is_any_admin(auth.uid()))
WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can delete suppliers"
ON public.suppliers FOR DELETE
TO authenticated
USING (is_any_admin(auth.uid()));

-- RLS Policies for purchase orders
CREATE POLICY "Admins can view purchase orders"
ON public.purchase_orders FOR SELECT
TO authenticated
USING (is_any_admin(auth.uid()));

CREATE POLICY "Admins can insert purchase orders"
ON public.purchase_orders FOR INSERT
TO authenticated
WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can update purchase orders"
ON public.purchase_orders FOR UPDATE
TO authenticated
USING (is_any_admin(auth.uid()))
WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can delete purchase orders"
ON public.purchase_orders FOR DELETE
TO authenticated
USING (is_any_admin(auth.uid()));

-- RLS Policies for purchase order items
CREATE POLICY "Admins can manage purchase order items"
ON public.purchase_order_items FOR ALL
TO authenticated
USING (is_any_admin(auth.uid()))
WITH CHECK (is_any_admin(auth.uid()));

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Function to update PO total when items change
CREATE OR REPLACE FUNCTION update_po_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update PO total
DROP TRIGGER IF EXISTS trigger_update_po_total ON purchase_order_items;
CREATE TRIGGER trigger_update_po_total
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_po_total();

-- Function to update product stock when PO is received
CREATE OR REPLACE FUNCTION update_stock_on_po_receive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update stock when status changes to 'received'
  IF NEW.status = 'received' AND OLD.status != 'received' THEN
    -- Update stock for all items in this PO
    UPDATE products p
    SET stock = stock + poi.received_quantity,
        updated_at = now()
    FROM purchase_order_items poi
    WHERE poi.purchase_order_id = NEW.id
    AND p.product_id = poi.product_id
    AND poi.received_quantity > 0;
    
    -- Set actual delivery date
    NEW.actual_delivery_date := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update stock on PO receive
DROP TRIGGER IF EXISTS trigger_update_stock_on_po_receive ON purchase_orders;
CREATE TRIGGER trigger_update_stock_on_po_receive
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
WHEN (NEW.status = 'received' AND OLD.status != 'received')
EXECUTE FUNCTION update_stock_on_po_receive();

-- Update the low stock notification function to use reorder_point
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  current_stock INTEGER,
  reorder_point INTEGER,
  preferred_supplier_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.product_id,
    p.name,
    p.stock,
    p.reorder_point,
    s.name as preferred_supplier_name
  FROM products p
  LEFT JOIN suppliers s ON p.preferred_supplier_id = s.id
  WHERE p.stock <= p.reorder_point
  AND p.reorder_point IS NOT NULL
  ORDER BY (p.reorder_point - p.stock) DESC;
END;
$$;