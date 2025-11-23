-- =============================================
-- CUSTOMER REVIEWS IMPROVEMENTS
-- =============================================

-- Add verified_purchase and helpful_count to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS verified_purchase boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS helpful_count integer DEFAULT 0;

-- Create review_votes table for helpful votes
CREATE TABLE IF NOT EXISTS public.review_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(review_id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Create review_replies table for admin/moderator replies
CREATE TABLE IF NOT EXISTS public.review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(review_id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reply_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on review_votes
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_votes
CREATE POLICY "Anyone can view review votes"
  ON public.review_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote on reviews"
  ON public.review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.review_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.review_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on review_replies
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_replies
CREATE POLICY "Anyone can view review replies"
  ON public.review_replies FOR SELECT
  USING (true);

CREATE POLICY "Admins and moderators can create replies"
  ON public.review_replies FOR INSERT
  WITH CHECK (
    is_any_admin(auth.uid()) OR has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Reply authors can update their replies"
  ON public.review_replies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete replies"
  ON public.review_replies FOR DELETE
  USING (is_any_admin(auth.uid()));

-- Function to update helpful_count when votes change
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.reviews
    SET helpful_count = (
      SELECT COUNT(*) 
      FROM public.review_votes 
      WHERE review_id = NEW.review_id AND vote_type = 'helpful'
    )
    WHERE review_id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews
    SET helpful_count = (
      SELECT COUNT(*) 
      FROM public.review_votes 
      WHERE review_id = OLD.review_id AND vote_type = 'helpful'
    )
    WHERE review_id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for helpful count updates
DROP TRIGGER IF EXISTS update_review_helpful_count_trigger ON public.review_votes;
CREATE TRIGGER update_review_helpful_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- =============================================
-- LOYALTY & REWARDS PROGRAM
-- =============================================

-- Create loyalty_points table
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  total_redeemed integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create points_transactions table for tracking
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'refund')),
  source text NOT NULL, -- 'purchase', 'review', 'referral', 'reward_redemption', etc.
  reference_id text, -- order_id, review_id, referral_id, etc.
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create rewards catalog table
CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_required integer NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('discount', 'free_shipping', 'product', 'voucher')),
  reward_value jsonb NOT NULL, -- {discount_percent: 10} or {product_id: "xxx"} or {shipping_credit: 500}
  is_active boolean DEFAULT true,
  stock_quantity integer,
  max_redemptions_per_user integer DEFAULT 1,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reward_redemptions table
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  points_spent integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'refunded')),
  voucher_code text UNIQUE,
  redeemed_at timestamptz DEFAULT now(),
  used_at timestamptz,
  expires_at timestamptz,
  order_id text -- if used in an order
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referred_user_id uuid,
  referral_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  points_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS on all loyalty tables
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_points
CREATE POLICY "Users can view their own points"
  ON public.loyalty_points FOR SELECT
  USING (auth.uid() = user_id OR is_any_admin(auth.uid()));

CREATE POLICY "System can manage points"
  ON public.loyalty_points FOR ALL
  USING (true);

-- RLS Policies for points_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.points_transactions FOR SELECT
  USING (auth.uid() = user_id OR is_any_admin(auth.uid()));

CREATE POLICY "System can create transactions"
  ON public.points_transactions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for rewards
CREATE POLICY "Anyone can view active rewards"
  ON public.rewards FOR SELECT
  USING (is_active = true OR is_any_admin(auth.uid()));

CREATE POLICY "Admins can manage rewards"
  ON public.rewards FOR ALL
  USING (is_any_admin(auth.uid()));

-- RLS Policies for reward_redemptions
CREATE POLICY "Users can view their own redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (auth.uid() = user_id OR is_any_admin(auth.uid()));

CREATE POLICY "Users can redeem rewards"
  ON public.reward_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage redemptions"
  ON public.reward_redemptions FOR ALL
  USING (is_any_admin(auth.uid()));

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id OR is_any_admin(auth.uid()));

CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "System can update referrals"
  ON public.referrals FOR UPDATE
  USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id_param uuid)
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := 'REF' || UPPER(substring(md5(random()::text || user_id_param::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to award points for purchase
CREATE OR REPLACE FUNCTION award_purchase_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award integer;
  user_uuid uuid;
BEGIN
  -- Award 1 point per 100 KES spent (adjust as needed)
  points_to_award := FLOOR(NEW.amount / 100);
  user_uuid := NEW.user_id;
  
  IF user_uuid IS NOT NULL AND NEW.status = 'delivered' AND points_to_award > 0 THEN
    -- Insert or update loyalty points
    INSERT INTO public.loyalty_points (user_id, points, total_earned)
    VALUES (user_uuid, points_to_award, points_to_award)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      points = public.loyalty_points.points + points_to_award,
      total_earned = public.loyalty_points.total_earned + points_to_award,
      updated_at = now();
    
    -- Record transaction
    INSERT INTO public.points_transactions (user_id, points, transaction_type, source, reference_id, description)
    VALUES (user_uuid, points_to_award, 'earn', 'purchase', NEW.order_id, 'Points earned from order ' || NEW.order_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for purchase points
DROP TRIGGER IF EXISTS award_purchase_points_trigger ON public.orders;
CREATE TRIGGER award_purchase_points_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND OLD.status != 'delivered')
  EXECUTE FUNCTION award_purchase_points();

-- Function to award points for review
CREATE OR REPLACE FUNCTION award_review_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award integer := 10; -- 10 points per review
BEGIN
  -- Insert or update loyalty points
  INSERT INTO public.loyalty_points (user_id, points, total_earned)
  VALUES (NEW.user_id, points_to_award, points_to_award)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points = public.loyalty_points.points + points_to_award,
    total_earned = public.loyalty_points.total_earned + points_to_award,
    updated_at = now();
  
  -- Record transaction
  INSERT INTO public.points_transactions (user_id, points, transaction_type, source, reference_id, description)
  VALUES (NEW.user_id, points_to_award, 'earn', 'review', NEW.review_id::text, 'Points earned for writing a review');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for review points
DROP TRIGGER IF EXISTS award_review_points_trigger ON public.reviews;
CREATE TRIGGER award_review_points_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_review_points();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON public.points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON public.reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_user_id);