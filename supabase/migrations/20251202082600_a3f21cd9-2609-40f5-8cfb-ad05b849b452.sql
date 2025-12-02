-- Create contact_settings table for dynamic contact information
CREATE TABLE public.contact_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key varchar NOT NULL UNIQUE,
  setting_value text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view contact settings
CREATE POLICY "Everyone can view contact settings"
ON public.contact_settings FOR SELECT
USING (true);

-- Only superadmins can modify
CREATE POLICY "Superadmins can insert contact settings"
ON public.contact_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can update contact settings"
ON public.contact_settings FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can delete contact settings"
ON public.contact_settings FOR DELETE
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Insert default values
INSERT INTO public.contact_settings (setting_key, setting_value, description) VALUES
('phone', '+254 758 475 467', 'Main contact phone number'),
('email', 'support@smartkenya.co.ke', 'Support email address'),
('address', 'SmartKenya, Murang''a, Kenya', 'Physical address'),
('business_hours', 'Mon-Fri from 8am to 5pm', 'Business operating hours'),
('facebook_url', 'https://facebook.com/smartkenya', 'Facebook page URL'),
('twitter_url', 'https://twitter.com/smartkenya', 'Twitter/X profile URL'),
('instagram_url', 'https://instagram.com/smartkenya', 'Instagram profile URL'),
('youtube_url', 'https://youtube.com/smartkenya', 'YouTube channel URL'),
('whatsapp_number', '+254758475467', 'WhatsApp contact number'),
('tiktok_url', '', 'TikTok profile URL');