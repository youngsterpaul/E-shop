const canUserReviewProduct = async (productId: string) => {
  if (!user) return false;
  
  console.log('Checking eligibility for:', {
    userId: user.id,
    productId: productId
  });
  
  // First, let's check manually what we can find
  try {
    // Check if user has any orders with this product
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('order_id, status, items, user_id')
      .eq('user_id', user.id);
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    } else {
      console.log('User orders:', orders);
      
      // Check if any order contains this product
      const ordersWithProduct = orders?.filter(order => {
        const items = order.items as any[];
        return items?.some(item => item.product?.id === productId);
      });
      
      console.log('Orders containing this product:', ordersWithProduct);
    }
    
    // Check if user already reviewed this product
    const { data: existingReview, error: reviewError } = await supabase
      .from('reviews')
      .select('review_id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .limit(1);
    
    if (reviewError) {
      console.error('Error checking existing reviews:', reviewError);
    } else {
      console.log('Existing review:', existingReview);
    }
    
  } catch (error) {
    console.error('Manual check error:', error);
  }
  
  // Now call the original RPC function
  const { data, error } = await supabase.rpc('can_user_review_product', {
    p_user_id: user.id,
    p_product_id: productId
  });

  if (error) {
    console.error('RPC Error checking review eligibility:', error);
    return false;
  }
  
  console.log('RPC function result:', data);
  return data;
};