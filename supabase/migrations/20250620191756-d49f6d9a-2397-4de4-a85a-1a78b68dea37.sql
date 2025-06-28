
-- Create review_votes table for tracking helpful/not helpful votes on reviews
CREATE TABLE public.review_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Add Row Level Security
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for review votes
CREATE POLICY "Users can view all review votes" 
  ON public.review_votes 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert review votes" 
  ON public.review_votes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review votes" 
  ON public.review_votes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review votes" 
  ON public.review_votes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON public.review_votes(user_id);
CREATE INDEX idx_review_votes_vote_type ON public.review_votes(vote_type);
