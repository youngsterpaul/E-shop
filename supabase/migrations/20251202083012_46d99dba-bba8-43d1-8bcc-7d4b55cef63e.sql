-- Create job_listings table for careers page
CREATE TABLE public.job_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar NOT NULL,
  department varchar NOT NULL,
  location varchar NOT NULL,
  experience varchar NOT NULL,
  type varchar NOT NULL DEFAULT 'Full-time',
  salary_range varchar,
  responsibilities text[] DEFAULT '{}',
  requirements text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

-- Everyone can view active job listings
CREATE POLICY "Everyone can view active jobs"
ON public.job_listings FOR SELECT
USING (is_active = true OR is_any_admin(auth.uid()));

-- Admins can manage job listings
CREATE POLICY "Admins can insert jobs"
ON public.job_listings FOR INSERT
WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can update jobs"
ON public.job_listings FOR UPDATE
USING (is_any_admin(auth.uid()));

CREATE POLICY "Admins can delete jobs"
ON public.job_listings FOR DELETE
USING (is_any_admin(auth.uid()));

-- Insert sample data
INSERT INTO public.job_listings (title, department, location, experience, type, salary_range, responsibilities, requirements, display_order) VALUES
('Digital Marketing Manager', 'Marketing', 'Remote/Hybrid', '3-5 years', 'Full-time', 'Ksh 60,000 - Ksh 80,000',
 ARRAY['Develop and execute comprehensive SEO strategies', 'Create and manage content marketing campaigns', 'Oversee social media management and growth', 'Analyze campaign performance and optimize ROI', 'Lead cross-functional marketing initiatives'],
 ARRAY['Bachelor''s degree in Marketing or related field', 'Google Analytics and AdWords certified', '3-5 years of digital marketing experience', 'Proficiency in marketing automation tools', 'Strong analytical and project management skills'],
 1),
('Sales Development Representative', 'Sales', 'On-site', '1-3 years', 'Full-time', 'Ksh 45,000 - Ksh 65,000 + commission',
 ARRAY['Generate and qualify leads through various channels', 'Conduct cold outreach via phone and email', 'Manage and maintain sales pipeline in CRM', 'Collaborate with sales team to close deals', 'Meet and exceed monthly lead generation targets'],
 ARRAY['Previous sales or customer service experience', 'Proficiency with CRM systems (Salesforce preferred)', 'Excellent verbal and written communication skills', 'Strong interpersonal and negotiation abilities', 'Goal-oriented with a competitive mindset'],
 2),
('Marketing Coordinator', 'Marketing', 'Remote', 'Entry level - 2 years', 'Full-time', 'Ksh 40,000 - Ksh 55,000',
 ARRAY['Execute multi-channel marketing campaigns', 'Plan and coordinate marketing events and webinars', 'Create engaging content for various platforms', 'Assist with market research and competitive analysis', 'Support lead generation and nurturing activities'],
 ARRAY['Bachelor''s degree in Marketing, Communications, or related field', 'Strong social media and content creation skills', 'Creative thinking with attention to detail', 'Basic knowledge of design tools (Canva, Adobe Creative Suite)', 'Excellent organizational and time management skills'],
 3);