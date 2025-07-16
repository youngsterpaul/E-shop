
-- Create function to get review votes
CREATE OR REPLACE FUNCTION get_review_votes(review_id UUID)
RETURNS TABLE (
  vote_type TEXT,
  user_id UUID
)
LANGUAGE SQL
STABLE
AS $$
  SELECT vote_type, user_id
  FROM review_votes
  WHERE review_votes.review_id = $1;
$$;

-- Create function to get user's vote for a review
CREATE OR REPLACE FUNCTION get_user_review_vote(review_id UUID, user_id UUID)
RETURNS TABLE (
  vote_type TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT vote_type
  FROM review_votes
  WHERE review_votes.review_id = $1 AND review_votes.user_id = $2
  LIMIT 1;
$$;

-- Create function to create a review vote
CREATE OR REPLACE FUNCTION create_review_vote(review_id UUID, user_id UUID, vote_type TEXT)
RETURNS VOID
LANGUAGE SQL
AS $$
  INSERT INTO review_votes (review_id, user_id, vote_type)
  VALUES ($1, $2, $3);
$$;

-- Create function to update a review vote
CREATE OR REPLACE FUNCTION update_review_vote(review_id UUID, user_id UUID, new_vote_type TEXT)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE review_votes
  SET vote_type = $3
  WHERE review_votes.review_id = $1 AND review_votes.user_id = $2;
$$;

-- Create function to delete a review vote
CREATE OR REPLACE FUNCTION delete_review_vote(review_id UUID, user_id UUID)
RETURNS VOID
LANGUAGE SQL
AS $$
  DELETE FROM review_votes
  WHERE review_votes.review_id = $1 AND review_votes.user_id = $2;
$$;
