-- Create site_content table for About page and other static content
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Everyone can view active content
CREATE POLICY "Anyone can view active site content"
  ON public.site_content
  FOR SELECT
  USING (is_active = true);

-- Admins can manage content
CREATE POLICY "Admins can manage site content"
  ON public.site_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin', 'admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default About page content
INSERT INTO public.site_content (page_key, title, content) VALUES
('about', 'About SmartKenya', '{
  "story": {
    "title": "Our Story",
    "paragraphs": [
      "Founded in 2025, SmartKenya started with a simple mission: to make quality products accessible to everyone in Kenya and beyond. What began as a small online shop operating out of a garage in Embu has grown into one of East Africa''s most trusted e-commerce platforms.",
      "Our name \"SmartKenya\" combines \"Smart\" and \"Kenya\" - representing freshness and vitality - with \"S\" - symbolizing our forward-thinking approach and commitment to innovation in the African e-commerce space.",
      "Today, SmartKenya connects thousands of sellers with millions of customers across the region, offering everything from electronics and fashion to home goods and groceries. We remain committed to our core values of quality, accessibility, and exceptional customer service."
    ]
  },
  "mission": {
    "title": "Our Mission",
    "paragraphs": [
      "At SmartKenya, we''re on a mission to revolutionize how people shop in Africa by creating a seamless, trustworthy online marketplace that empowers both buyers and sellers.",
      "We strive to provide access to quality products at competitive prices, support local businesses, and contribute to economic growth in the communities we serve."
    ]
  },
  "values": [
    {"name": "Quality", "description": "We carefully vet all products on our platform to ensure they meet our high standards."},
    {"name": "Affordability", "description": "We work to make high-quality products affordable to as many people as possible."},
    {"name": "Community", "description": "We support local businesses and invest in the communities where we operate."},
    {"name": "Trust", "description": "We build trust through transparent practices and reliable service."}
  ],
  "cta": {
    "title": "Join Our Journey",
    "description": "We''re always looking for talented individuals to join our team and help us shape the future of e-commerce in Africa."
  }
}'::jsonb);