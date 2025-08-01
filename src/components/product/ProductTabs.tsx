import { useState, useEffect, useRef } from 'react';
import { Star, ThumbsUp, ThumbsDown, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useProductReviews } from '@/hooks/useReviews';
import { ScrollArea } from '@/components/ui/scroll-area';
import OptimizedImage from '../OptimizedImage';
import { isMobileUserAgent } from '@/hooks/use-mobile';

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
  const [showMoreSpecs, setShowMoreSpecs] = useState(false);
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  const [showMoreReviews, setShowMoreReviews] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  const tabsRef = useRef(null);
  const specificationsRef = useRef(null);
  const featuresRef = useRef(null);
  const reviewsRef = useRef(null);

  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(product.product_id);
  const isMobile = isMobileUserAgent();

  // Handle sticky tabs and auto-switching
  useEffect(() => {
    const handleScroll = () => {
      if (!tabsRef.current || !specificationsRef.current || !featuresRef.current || !reviewsRef.current) return;

      const tabsRect = tabsRef.current.getBoundingClientRect();
      const specsRect = specificationsRef.current.getBoundingClientRect();
      const featuresRect = featuresRef.current.getBoundingClientRect();
      const reviewsRect = reviewsRef.current.getBoundingClientRect();

      // Make tabs sticky when they reach the top
      setIsSticky(tabsRect.top <= 0);

      // Auto-switch tabs based on scroll position
      const offset = 100; // Offset to trigger tab change
      
      if (reviewsRect.top <= offset) {
        setActiveTab('reviews');
      } else if (featuresRect.top <= offset) {
        setActiveTab('features');
      } else if (specsRect.top <= offset) {
        setActiveTab('specifications');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle tab click scrolling
  const scrollToSection = (tab) => {
    const refs = {
      specifications: specificationsRef,
      features: featuresRef,
      reviews: reviewsRef
    };
    
    const targetRef = refs[tab];
    if (targetRef?.current) {
      const offset = 80; // Account for sticky header
      const elementPosition = targetRef.current.offsetTop;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setActiveTab(tab);
  };

  // Parse features
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

  // Show/hide logic
  const SPECS_LIMIT = 8;
  const FEATURES_LIMIT = 6;
  const REVIEWS_LIMIT = 3;

  const visibleSpecs = showMoreSpecs 
    ? Object.entries(specifications) 
    : Object.entries(specifications).slice(0, SPECS_LIMIT);

  const visibleFeatures = showMoreFeatures 
    ? features 
    : features.slice(0, FEATURES_LIMIT);

  const visibleReviews = showMoreReviews 
    ? filteredReviews 
    : filteredReviews.slice(0, REVIEWS_LIMIT);

  return (
    <div className="mt-12 mx-auto px-2">
      {/* Sticky Tab Navigation */}
      <div 
        ref={tabsRef}
        className={`bg-white transition-all duration-300 ${
          isSticky ? 'fixed top-0 left-0 right-0 z-50 shadow-md px-4 py-2' : 'relative'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'specifications', label: 'Specifications' },
              { key: 'features', label: 'Features' },
              { key: 'reviews', label: `Reviews (${totalReviews})` }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => scrollToSection(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add spacing when tabs are sticky */}
      {isSticky && <div className={`${isMobile ? '' : 'h-16'}`} />}

      {/* Specifications Section */}
      <div ref={specificationsRef} className="mt-8">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Specifications</h3>
            </div>
            <div className="p-6">
              {Object.keys(specifications).length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleSpecs.map(([key, value]) => (
                      <div key={key} className="group">
                        <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg p-4 border border-gray-200">
                          <dt className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">
                            {key.replace(/[_-]/g, ' ')}
                          </dt>
                          <dd className="text-gray-700 font-medium">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </dd>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {Object.entries(specifications).length > SPECS_LIMIT && (
                    <div className="text-center pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setShowMoreSpecs(!showMoreSpecs)}
                        className="gap-2"
                      >
                        {showMoreSpecs ? (
                          <>
                            <ChevronUp size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            Show More ({Object.entries(specifications).length - SPECS_LIMIT} more)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-8">No specifications available for this product.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="mt-8">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Features</h3>
            </div>
            <div className="p-6">
              {features.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {visibleFeatures.map((feature, index) => (
                      <div key={index} className="group">
                        <div className="flex items-start p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg border border-gray-200">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-0">
                            <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-800 leading-relaxed font-medium">{feature}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {features.length > FEATURES_LIMIT && (
                    <div className="text-center pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setShowMoreFeatures(!showMoreFeatures)}
                        className="gap-2"
                      >
                        {showMoreFeatures ? (
                          <>
                            <ChevronUp size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            Show More ({features.length - FEATURES_LIMIT} more)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>  
              ) : (
                <p className="text-gray-500 italic text-center py-8">No features listed for this product.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      <div ref={reviewsRef} className="mt-8">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Review Summary */}
                {totalReviews > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Overall Rating */}
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
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
                  </div>
                )}

                {/* Review Filters */}
                {totalReviews > 0 && (
                  <div className="bg-white border rounded-lg p-4">
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
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviewsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading reviews...</p>
                    </div>
                  ) : filteredReviews.length > 0 ? (
                    <>
                      {visibleReviews.map((review) => (
                        <Card key={review.review_id} className="hover:shadow-md transition-shadow">
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
                              <div className="flex gap-2 overflow-x-auto mb-4">
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
                            <div className="flex items-center gap-4 pt-4 border-t">
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
                      
                      {filteredReviews.length > REVIEWS_LIMIT && (
                        <div className="text-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowMoreReviews(!showMoreReviews)}
                            className="gap-2"
                          >
                            {showMoreReviews ? (
                              <>
                                <ChevronUp size={16} />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown size={16} />
                                Show More ({filteredReviews.length - REVIEWS_LIMIT} more)
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductTabs;
