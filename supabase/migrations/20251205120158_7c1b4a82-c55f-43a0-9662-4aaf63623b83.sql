-- Create A/B tests table for hero banners and CTAs
CREATE TABLE public.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  test_type VARCHAR(50) NOT NULL DEFAULT 'hero_banner', -- 'hero_banner', 'cta', 'layout'
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  variant_a JSONB NOT NULL DEFAULT '{}',
  variant_b JSONB NOT NULL DEFAULT '{}',
  traffic_split INTEGER NOT NULL DEFAULT 50, -- Percentage for variant A
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create A/B test results table for tracking
CREATE TABLE public.ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  variant VARCHAR(1) NOT NULL, -- 'A' or 'B'
  event_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'conversion'
  session_id VARCHAR(255),
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for ab_tests
CREATE POLICY "Admins can manage A/B tests"
ON public.ab_tests FOR ALL
USING (is_any_admin((SELECT auth.uid())));

CREATE POLICY "Public can view active A/B tests"
ON public.ab_tests FOR SELECT
USING (status = 'active');

-- RLS policies for ab_test_results
CREATE POLICY "System can insert A/B test results"
ON public.ab_test_results FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view A/B test results"
ON public.ab_test_results FOR SELECT
USING (is_any_admin((SELECT auth.uid())));

-- Create index for performance
CREATE INDEX idx_ab_test_results_test_id ON public.ab_test_results(test_id);
CREATE INDEX idx_ab_test_results_created_at ON public.ab_test_results(created_at);
CREATE INDEX idx_ab_tests_status ON public.ab_tests(status);

-- Update timestamp trigger
CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON public.ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();