
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

  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!user) {
        setCanReview(false);
        setIsLoading(false);
        return;
      }

      try {
        const eligible = await canUserReviewProduct(productId);
        setCanReview(eligible);
      } catch (error) {
        console.error('Error checking review eligibility:', error);
        setCanReview(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkReviewEligibility();
  }, [user, productId, canUserReviewProduct]);

  if (isLoading || !canReview) {
    return null;
  }

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
