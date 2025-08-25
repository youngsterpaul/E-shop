import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface ReviewButtonProps {
  productId: string;
  productName: string;
  size?: 'sm' | 'default';
}

const ReviewButton = ({ productId, productName, size = 'default' }: ReviewButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canUserReviewProduct } = useReviews();
  const [canReview, setCanReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add debugging
  console.log('ReviewButton rendered for product:', productId);
  console.log('User:', user);
  console.log('isLoading:', isLoading);
  console.log('canReview:', canReview);

  useEffect(() => {
    const checkReviewEligibility = async () => {
      console.log('Checking review eligibility...');
      
      if (!user) {
        console.log('No user found');
        setCanReview(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Calling canUserReviewProduct...');
        const eligible = await canUserReviewProduct(productId);
        console.log('Review eligible result:', eligible);
        setCanReview(eligible || true);
      } catch (error) {
        console.error('Error checking review eligibility:', error);
        setCanReview(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkReviewEligibility();
  }, [user, productId, canUserReviewProduct]);

  // Show loading state for debugging
  if (isLoading) {
    console.log('ReviewButton: Still loading...');
    return <div>Loading review button...</div>; // Temporary for debugging
  }

  if (!canReview) {
    console.log('ReviewButton: Cannot review');
    return <div>Cannot review this product</div>; // Temporary for debugging
  }

  console.log('ReviewButton: Rendering button');
  return (
    <Button
      size={size}
      variant="outline"
      onClick={() => navigate(`/products/${productId}/review`)}
      className="flex items-center gap-2 border-orange-500 text-orange-500 hover:bg-orange-50"
    >
      <Star className="h-4 w-4" />
      Write Review
    </Button>
  );
};

export default ReviewButton;