import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { productKeys, productFetchers } from '@/queries/productQueries';

export interface ReviewReply {
  id: string;
  reply_text: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  review_id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  username: string;
  media_urls: string[];
  created_at: string;
  review_replies?: ReviewReply[];
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export const useReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canUserReviewProduct = async (productId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('can_user_review_product', {
        p_user_id: user.id,
        p_product_id: productId
      });
      if (error) {
        console.error('Error checking review eligibility:', error);
        return false;
      }
      return data ?? false;
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return false;
    }
  };

  // Utility function to sanitize file names
  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100); // Limit length
  };

  // Utility function to validate file
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return { isValid: false, error: 'Only images and videos are allowed' };
    }
    
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for videos, 10MB for images
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `File size exceeds ${isVideo ? '50MB' : '10MB'} limit` 
      };
    }

    // Check for supported formats
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const supportedVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
    
    if (isImage && !supportedImageTypes.includes(file.type)) {
      return { isValid: false, error: 'Unsupported image format' };
    }
    
    if (isVideo && !supportedVideoTypes.includes(file.type)) {
      return { isValid: false, error: 'Unsupported video format' };
    }

    return { isValid: true };
  };

  const uploadReviewMedia = async (
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    if (!user) throw new Error('User must be logged in');

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const sanitizedName = sanitizeFileName(file.name.replace(`.${fileExt}`, ''));
    const fileName = `${user.id}/${Date.now()}_${sanitizedName}.${fileExt}`;

    try {
      // Upload with progress tracking if supported
      const { data, error } = await supabase.storage
        .from('review-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false // Prevent overwriting
        });

      if (error) {
        // Handle specific Supabase storage errors
        if (error.message.includes('The resource already exists')) {
          throw new Error('File already exists. Please try again.');
        } else if (error.message.includes('Payload too large')) {
          throw new Error('File is too large for upload.');
        } else if (error.message.includes('Invalid file type')) {
          throw new Error('File type not supported.');
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('review-media')
        .getPublicUrl(data.path);

      if (onProgress) onProgress(100);
      
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Batch upload with progress tracking
  const uploadMultipleMedia = async (
    files: File[],
    onProgress?: (progress: UploadProgress[]) => void
  ): Promise<string[]> => {
    if (!user) throw new Error('User must be logged in');

    const uploadResults: string[] = [];
    const progressArray: UploadProgress[] = files.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const
    }));

    if (onProgress) onProgress([...progressArray]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const url = await uploadReviewMedia(file, (progress) => {
          progressArray[i].progress = progress;
          if (onProgress) onProgress([...progressArray]);
        });
        
        uploadResults.push(url);
        progressArray[i].status = 'completed';
        if (onProgress) onProgress([...progressArray]);
        
      } catch (error: any) {
        console.error(`Failed to upload ${file.name}:`, error);
        progressArray[i].status = 'error';
        progressArray[i].error = error.message;
        if (onProgress) onProgress([...progressArray]);
        
        // Continue with other files instead of failing completely
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive"
        });
      }
    }

    return uploadResults;
  };

  const submitReview = async (reviewData: {
    product_id: string;
    rating: number;
    comment: string;
    media_urls: string[];
    review_id?: string; // Optional review_id for updates
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

    let data, error;

    if (reviewData.review_id) {
      // Update existing review
      const result = await supabase
        .from('reviews')
        .update({
          rating: reviewData.rating,
          comment: reviewData.comment,
          media_urls: reviewData.media_urls
        })
        .eq('review_id', reviewData.review_id)
        .eq('user_id', user.id) // Ensure user can only update their own review
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Insert new review
      const result = await supabase
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
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Review submission error:', error);
      throw new Error(`Failed to ${reviewData.review_id ? 'update' : 'submit'} review: ${error.message}`);
    }

    // Invalidate reviews cache
    queryClient.invalidateQueries({ queryKey: productKeys.reviews(reviewData.product_id) });
    
    return data;
  };

  // Delete uploaded media (useful for cleanup)
  const deleteReviewMedia = async (url: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Extract file path from public URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('review-media')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  return {
    canUserReviewProduct,
    submitReview,
    uploadReviewMedia,
    uploadMultipleMedia,
    deleteReviewMedia,
    validateFile
  };
};

export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: productKeys.reviews(productId),
    queryFn: () => productFetchers.fetchProductReviews(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};