
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface Review {
  review_id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  username: string;
  media_urls: string[];
  created_at: string;
}

export const useReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchProductReviews = async (productId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Review[];
  };

  const canUserReviewProduct = async (productId: string) => {
    if (!user) return false;
    
  // Original code commented out
  // const { data, error } = await supabase.rpc('can_user_review_product', {
  //   p_user_id: user.id,
  //   p_product_id: productId
  // });
  // if (error) {
  //   console.error('Error checking review eligibility:', error);
  //   return false;
  // }
  // return data;
  };

  const submitReview = async (reviewData: {
    product_id: string;
    rating: number;
    comment: string;
    media_urls: string[];
  }) => {
    if (!user) throw new Error('User must be logged in');

    // Get user profile for username
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();

    const username = profile 
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous'
      : 'Anonymous';

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        product_id: reviewData.product_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        username,
        media_urls: reviewData.media_urls
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate reviews cache
    queryClient.invalidateQueries({ queryKey: ['reviews', reviewData.product_id] });
    
    return data;
  };

  const uploadReviewMedia = async (file: File) => {
    if (!user) throw new Error('User must be logged in');

    // Validate file size (50MB limit for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${file.type.startsWith('video/') ? '50MB' : '10MB'} limit`);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('review-media')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('review-media')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  return {
    fetchProductReviews,
    canUserReviewProduct,
    submitReview,
    uploadReviewMedia
  };
};

export const useProductReviews = (productId: string) => {
  const { fetchProductReviews } = useReviews();
  
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => fetchProductReviews(productId),
    enabled: !!productId
  });
};
