import { useState } from 'react';
import { useProductReviews } from '@/hooks/useReviews';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import ReviewVoteButtons from '@/components/enhanced/ReviewVoteButtons';

interface ReviewDisplayProps {
  productId: string;
}

const ReviewDisplay = ({ productId }: ReviewDisplayProps) => {
  const { data: reviews, isLoading } = useProductReviews(productId);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
            <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-500">Be the first to review this product!</p>
      </div>
    );
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="flex justify-center mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= averageRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-500">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter(r => r.rating === rating).length;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center gap-2 mb-1">
                <span className="text-sm w-8">{rating}</span>
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <Card key={review.review_id} className="shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.username}</span>
                    <Badge variant="outline" className="text-xs">
                      Verified Purchase
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-3">{review.comment}</p>

              {/* Media Gallery */}
              {review.media_urls && review.media_urls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                  {review.media_urls.map((url, index) => {
                    const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedMedia(url)}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-75 transition-opacity"
                      >
                        {isVideo ? (
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                            controls={false}
                          />
                        ) : (
                          <img
                            src={url}
                            alt={`Review media ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Add Review Vote Buttons */}
              <ReviewVoteButtons 
                reviewId={review.review_id} 
                className="mt-3" 
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show More/Less Button */}
      {reviews.length > 3 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="flex items-center gap-2"
          >
            {showAllReviews ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show All {reviews.length} Reviews
              </>
            )}
          </Button>
        </div>
      )}

      {/* Media Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="max-w-4xl max-h-full overflow-auto">
            {selectedMedia.includes('.mp4') || selectedMedia.includes('.webm') || selectedMedia.includes('.mov') ? (
              <video
                src={selectedMedia}
                controls
                className="max-w-full max-h-full"
                autoPlay
              />
            ) : (
              <img
                src={selectedMedia}
                alt="Review media"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewDisplay;
