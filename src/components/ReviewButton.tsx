import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProductReviews } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { Star, Edit } from 'lucide-react';

interface ReviewButtonProps {
  productId: string;
  productName: string;
  size?: 'sm' | 'default';
}

const ReviewButton = ({ productId, productName, size = 'default' }: ReviewButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const [userReview, setUserReview] = useState<any>(null);

  useEffect(() => {
    if (!user || !reviews.length) {
      setUserReview(null);
      return;
    }

    // Check if user has already reviewed this product
    const existingReview = reviews.find((review) => review.user_id === user.id);
    setUserReview(existingReview);
  }, [user, reviews]);

  if (isLoading || !user) {
    return null;
  }

  const hasReviewed = !!userReview;

  return (
    <Button
      size={size}
      variant="outline"
      onClick={() => navigate(`/products/${productId}/review`, { 
        state: { existingReview: userReview } 
      })}
      className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
    >
      {hasReviewed ? (
        <>
          <Edit className="h-4 w-4" />
          Edit Review
        </>
      ) : (
        <>
          <Star className="h-4 w-4" />
          Write Review
        </>
      )}
    </Button>
  );
};

export default ReviewButton;