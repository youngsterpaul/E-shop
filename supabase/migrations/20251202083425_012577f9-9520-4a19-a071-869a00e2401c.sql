-- Create FAQ management table
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Everyone can view active FAQs
CREATE POLICY "Anyone can view active FAQs"
  ON public.faq_items
  FOR SELECT
  USING (is_active = true);

-- Admins can manage FAQs
CREATE POLICY "Admins can manage FAQs"
  ON public.faq_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin', 'admin')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default FAQ data
INSERT INTO public.faq_items (category, question, answer, display_order) VALUES
('Orders & Payments', 'How do I place an order?', 'To place an order, browse our products, add items to your cart, and proceed to checkout. You''ll need to provide delivery information and select a payment method. Once your order is confirmed, you''ll receive an order confirmation email.', 1),
('Orders & Payments', 'What payment methods do you accept?', 'We accept M-Pesa payments only. All payments are processed securely through our payment gateways.', 2),
('Orders & Payments', 'Can I cancel my order?', 'You can cancel your order within 1 hour of placing it if it hasn''t been processed yet. Contact our customer service team immediately to request cancellation.', 3),
('Orders & Payments', 'How do I track my order?', 'Once your order is shipped, you''ll receive a tracking number via email and SMS. You can use this number to track your order on our website under ''My Orders'' in your account dashboard.', 4),
('Shipping & Delivery', 'How long does delivery take?', 'Delivery times vary by location. Within Embu, delivery typically takes 1 or 2 hours. For other major cities in Kenya, delivery takes 1-3 hours.', 5),
('Shipping & Delivery', 'Do you ship internationally?', 'No, we only ship to some countries in Kenya. This includes Murang''a and Embu county.', 6),
('Shipping & Delivery', 'How much does shipping cost?', 'Shipping costs are calculated based on delivery location, package size, and weight. Free shipping is available for orders above Ksh 5,000 within Kenya. You can see the exact shipping cost during checkout before payment.', 7),
('Returns & Refunds', 'What is your return policy?', 'We accept returns within 7 days of delivery for most products, provided they are in their original condition with packaging and tags intact. Certain items like personal care products, underwear, and food items cannot be returned due to hygiene concerns.', 8),
('Returns & Refunds', 'How do I return an item?', 'To return an item, log into your account, go to ''My Orders'', select the order containing the item you wish to return, and click ''Request Return''. Follow the instructions to complete your return request.', 9),
('Product Information', 'Are your products authentic?', 'Yes, all products sold on SmartKenya are 100% authentic. We source directly from authorized distributors and brand owners, and have a strict anti-counterfeit policy.', 10),
('Product Information', 'What is the warranty period for electronics?', 'Warranty periods vary by product and brand. Most electronics come with a standard manufacturer''s warranty of 1 year. Extended warranties may be available for certain products.', 11);