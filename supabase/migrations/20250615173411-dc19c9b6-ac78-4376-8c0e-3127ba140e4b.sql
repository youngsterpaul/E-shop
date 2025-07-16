
-- Enable RLS on carts table
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to access their own carts
CREATE POLICY "Users can access their own carts" ON public.carts
  FOR ALL USING (auth.uid() = user_id);

-- Policy for guest users to access carts by session_id
CREATE POLICY "Guests can access carts by session_id" ON public.carts
  FOR ALL USING (
    user_id IS NULL AND 
    session_id IS NOT NULL AND 
    session_id != ''
  );

-- Enable RLS on cart_items table
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Policy for users to access cart items for their carts
CREATE POLICY "Users can access their cart items" ON public.cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE carts.id = cart_items.cart_id 
      AND (carts.user_id = auth.uid() OR (carts.user_id IS NULL AND carts.session_id IS NOT NULL))
    )
  );
