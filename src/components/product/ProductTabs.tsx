
import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProductReviews } from '@/hooks/useReviews';
import { ScrollArea } from '@/components/ui/scroll-area';
import OptimizedImage from '../OptimizedImage';

interface ProductTabsProps {
  product: {
    product_id: string;
    name: string;
    features?: string[] | string;
    attributes?: Record<string, any>;
    specification?: Record<string, any>;
  };
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState('specifications');
  const [reviewFilter, setReviewFilter] = useState('all');
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(product.product_id);

  // Parse features if it's a string
  const getFeatures = () => {
    if (!product.features) return [];
    if (typeof product.features === 'string') {
      try {
        const parsed = JSON.parse(product.features);
        return Array.isArray(parsed) ? parsed : [product.features];
      } catch {
        return [product.features];
      }
    }
    return Array.isArray(product.features) ? product.features : [];
  };

  const features = getFeatures();

  // Parse specifications
  const getSpecifications = () => {
    if (product.specification && typeof product.specification === 'object') {
      return product.specification;
    }
    if (product.attributes && typeof product.attributes === 'object') {
      return product.attributes;
    }
    return {};
  };

  const specifications = getSpecifications();

  // Filter reviews
  const getFilteredReviews = () => {
    if (reviewFilter === 'all') return reviews;
    const rating = parseInt(reviewFilter);
    return reviews.filter(review => review.rating === rating);
  };

  const filteredReviews = getFilteredReviews();

  // Calculate rating distribution
  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="mt-12">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="specifications" className="text-sm">Specifications</TabsTrigger>
          <TabsTrigger value="features" className="text-sm">Features</TabsTrigger>
          <TabsTrigger value="reviews" className="text-sm">
            Reviews ({totalReviews})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="specifications" className="animate-fade-in">
          <Card>
            <CardContent className="p-6">
              {Object.keys(specifications).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-200 pb-3">
                      <dl><dt className="font-medium text-gray-900 capitalize mb-1">
                        {key.replace(/[_-]/g, ' ')}
                      </dt>
                      <dd className="text-gray-700">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </dd></dl>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No specifications available for this product.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="animate-fade-in">
          <Card>
            <CardContent className="p-6">
              {features.length > 0 ? (
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary mr-3 mt-1">•</span>
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No features listed for this product.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="animate-fade-in">
          <div className="space-y-6">
            {/* Review Summary */}
            {totalReviews > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Overall Rating */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {averageRating.toFixed(1)}
                      </div>
                      <div className="flex justify-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(averageRating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-600">Based on {totalReviews} reviews</p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-8">{rating}★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: totalReviews > 0 
                                  ? `${(ratingDistribution[rating as keyof typeof ratingDistribution] / totalReviews) * 100}%` 
                                  : '0%' 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">
                            {ratingDistribution[rating as keyof typeof ratingDistribution]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Filters */}
            {totalReviews > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter size={16} className="text-gray-600" />
                    <span className="text-sm font-medium">Filter by rating:</span>
                    <Button
                      variant={reviewFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setReviewFilter('all')}
                    >
                      All
                    </Button>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <Button
                        key={rating}
                        variant={reviewFilter === rating.toString() ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReviewFilter(rating.toString())}
                      >
                        {rating}★
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading reviews...</p>
                </div>
              ) : filteredReviews.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {filteredReviews.map((review) => (
                      <Card key={review.review_id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{review.username}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating 
                                          ? 'text-yellow-400 fill-current' 
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                {formatDate(review.created_at)}
                              </p>
                            </div>
                            <Badge variant="outline">{review.rating}/5</Badge>
                          </div>
                          
                          <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                          
                          {/* Review Media - Fixed to handle undefined/null URLs */}
                          {review.media_urls && Array.isArray(review.media_urls) && review.media_urls.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto">
                              {review.media_urls
                                .filter(url => url && typeof url === 'string' && url.trim() !== '') // Filter out invalid URLs
                                .map((url, index) => (
                                  <div key={index} className="flex-shrink-0">
                                    {(url.includes('video') || url.includes('.mp4') || url.includes('.mov')) ? (
                                      <video
                                        src={url}
                                        className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                                        controls
                                      />
                                    ) : (
                                      <OptimizedImage
                                        src={url}
                                        alt={`Review image ${index + 1}`}
                                        width={80}
                                        height={80}
                                        className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                      />
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                          
                          {/* Review Actions */}
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                            <Button variant="ghost" size="sm" className="text-gray-600">
                              <ThumbsUp size={14} className="mr-1" />
                              Helpful
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-600">
                              <ThumbsDown size={14} className="mr-1" />
                              Not helpful
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">
                      {reviewFilter === 'all' 
                        ? 'No reviews yet. Be the first to review this product!' 
                        : `No ${reviewFilter}-star reviews found.`
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductTabs;
