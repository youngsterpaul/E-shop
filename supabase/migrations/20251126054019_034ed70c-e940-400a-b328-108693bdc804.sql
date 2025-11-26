-- Create flash_sales table
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create flash_sale_products junction table
CREATE TABLE IF NOT EXISTS public.flash_sale_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_sale_id UUID NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flash_sale_id, product_id)
);

-- Enable RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sale_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flash_sales
CREATE POLICY "Everyone can view active flash sales"
  ON public.flash_sales FOR SELECT
  USING (is_active = true AND start_date <= NOW() AND end_date >= NOW());

CREATE POLICY "Admins can manage flash sales"
  ON public.flash_sales FOR ALL
  USING (is_any_admin(auth.uid()))
  WITH CHECK (is_any_admin(auth.uid()));

-- RLS Policies for flash_sale_products
CREATE POLICY "Everyone can view flash sale products"
  ON public.flash_sale_products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.flash_sales 
    WHERE id = flash_sale_id 
    AND is_active = true 
    AND start_date <= NOW() 
    AND end_date >= NOW()
  ));

CREATE POLICY "Admins can manage flash sale products"
  ON public.flash_sale_products FOR ALL
  USING (is_any_admin(auth.uid()))
  WITH CHECK (is_any_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_flash_sales_active ON public.flash_sales(is_active, start_date, end_date);
CREATE INDEX idx_flash_sale_products_flash_sale_id ON public.flash_sale_products(flash_sale_id);
CREATE INDEX idx_flash_sale_products_product_id ON public.flash_sale_products(product_id);

-- Trigger to update updated_at
CREATE TRIGGER update_flash_sales_updated_at
  BEFORE UPDATE ON public.flash_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();