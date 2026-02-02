-- =============================================
-- GAMIFICATION SYSTEM: Achievements, Streaks, Member Tiers
-- =============================================

-- 1. User Achievements Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  badge_icon VARCHAR(100),
  points_awarded INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_type)
);

-- 2. User Streaks Table
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_type VARCHAR(50) DEFAULT 'login',
  total_active_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Member Tiers Configuration Table
CREATE TABLE IF NOT EXISTS public.member_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name VARCHAR(100) NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL UNIQUE,
  min_points INTEGER NOT NULL DEFAULT 0,
  max_points INTEGER,
  benefits JSONB DEFAULT '[]',
  badge_color VARCHAR(50) DEFAULT '#10b981',
  icon_name VARCHAR(50) DEFAULT 'Award',
  discount_percent NUMERIC(5,2) DEFAULT 0,
  free_shipping_threshold NUMERIC(10,2),
  priority_support BOOLEAN DEFAULT false,
  early_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. User Tier Membership Table
CREATE TABLE IF NOT EXISTS public.user_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tier_id UUID REFERENCES public.member_tiers(id),
  lifetime_points INTEGER DEFAULT 0,
  current_period_points INTEGER DEFAULT 0,
  tier_updated_at TIMESTAMPTZ DEFAULT now(),
  next_tier_progress NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Wishlist Sharing Table
CREATE TABLE IF NOT EXISTS public.shared_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  share_code VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(255) DEFAULT 'My Wishlist',
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- 6. Customer Insights/Analytics Summary Table (for admin dashboard)
CREATE TABLE IF NOT EXISTS public.customer_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_date DATE NOT NULL UNIQUE,
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  active_customers INTEGER DEFAULT 0,
  avg_order_value NUMERIC(12,2) DEFAULT 0,
  avg_lifetime_value NUMERIC(12,2) DEFAULT 0,
  churn_rate NUMERIC(5,2) DEFAULT 0,
  top_categories JSONB DEFAULT '[]',
  customer_segments JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_streaks
CREATE POLICY "Users can view their own streaks"
ON public.user_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
ON public.user_streaks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
ON public.user_streaks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for member_tiers (public read)
CREATE POLICY "Anyone can view member tiers"
ON public.member_tiers FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage tiers"
ON public.member_tiers FOR ALL
USING ((SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'admin'))));

-- RLS Policies for user_tiers
CREATE POLICY "Users can view their own tier"
ON public.user_tiers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tier"
ON public.user_tiers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tier"
ON public.user_tiers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for shared_wishlists
CREATE POLICY "Users can manage their own shared wishlists"
ON public.shared_wishlists FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public shared wishlists"
ON public.shared_wishlists FOR SELECT
USING (is_public = true);

-- RLS Policies for customer_insights (admin only)
CREATE POLICY "Only admins can view customer insights"
ON public.customer_insights FOR SELECT
USING ((SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role IN ('superadmin', 'admin', 'moderator'))));

-- Insert default member tiers
INSERT INTO public.member_tiers (tier_name, tier_level, min_points, max_points, benefits, badge_color, icon_name, discount_percent, priority_support, early_access) VALUES
  ('Bronze', 1, 0, 999, '["5% off on birthdays", "Early sale access"]', '#CD7F32', 'Medal', 0, false, false),
  ('Silver', 2, 1000, 4999, '["5% discount on all orders", "Free shipping over KES 5000", "Birthday bonus points"]', '#C0C0C0', 'Star', 5, false, true),
  ('Gold', 3, 5000, 14999, '["10% discount on all orders", "Free shipping over KES 2500", "Priority support", "Exclusive deals"]', '#FFD700', 'Crown', 10, true, true),
  ('Platinum', 4, 15000, NULL, '["15% discount on all orders", "Free shipping always", "VIP support", "Early product access", "Exclusive events"]', '#E5E4E2', 'Gem', 15, true, true)
ON CONFLICT (tier_name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tiers_user_id ON public.user_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_wishlists_share_code ON public.shared_wishlists(share_code);
CREATE INDEX IF NOT EXISTS idx_customer_insights_date ON public.customer_insights(insight_date DESC);

-- Function to update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_total_days INTEGER;
BEGIN
  -- Get current streak data
  SELECT last_activity_date, current_streak, longest_streak, total_active_days
  INTO v_last_date, v_current_streak, v_longest_streak, v_total_days
  FROM public.user_streaks
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_active_days)
    VALUES (p_user_id, 1, 1, CURRENT_DATE, 1);
  ELSIF v_last_date = CURRENT_DATE THEN
    -- Already logged in today, do nothing
    NULL;
  ELSIF v_last_date = CURRENT_DATE - 1 THEN
    -- Consecutive day
    UPDATE public.user_streaks
    SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_activity_date = CURRENT_DATE,
      total_active_days = total_active_days + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken
    UPDATE public.user_streaks
    SET 
      current_streak = 1,
      last_activity_date = CURRENT_DATE,
      total_active_days = total_active_days + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;