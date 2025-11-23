-- Fix security warnings by setting search_path on functions

-- Fix update_review_helpful_count function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix generate_referral_code function
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
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix award_purchase_points function
CREATE OR REPLACE FUNCTION award_purchase_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award integer;
  user_uuid uuid;
BEGIN
  points_to_award := FLOOR(NEW.amount / 100);
  user_uuid := NEW.user_id;
  
  IF user_uuid IS NOT NULL AND NEW.status = 'delivered' AND points_to_award > 0 THEN
    INSERT INTO public.loyalty_points (user_id, points, total_earned)
    VALUES (user_uuid, points_to_award, points_to_award)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      points = public.loyalty_points.points + points_to_award,
      total_earned = public.loyalty_points.total_earned + points_to_award,
      updated_at = now();
    
    INSERT INTO public.points_transactions (user_id, points, transaction_type, source, reference_id, description)
    VALUES (user_uuid, points_to_award, 'earn', 'purchase', NEW.order_id, 'Points earned from order ' || NEW.order_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix award_review_points function
CREATE OR REPLACE FUNCTION award_review_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award integer := 10;
BEGIN
  INSERT INTO public.loyalty_points (user_id, points, total_earned)
  VALUES (NEW.user_id, points_to_award, points_to_award)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points = public.loyalty_points.points + points_to_award,
    total_earned = public.loyalty_points.total_earned + points_to_award,
    updated_at = now();
  
  INSERT INTO public.points_transactions (user_id, points, transaction_type, source, reference_id, description)
  VALUES (NEW.user_id, points_to_award, 'earn', 'review', NEW.review_id::text, 'Points earned for writing a review');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;