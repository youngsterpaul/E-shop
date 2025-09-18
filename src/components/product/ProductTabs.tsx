import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, ThumbsUp, ThumbsDown, Filter, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [originalTabsTop, setOriginalTabsTop] = useState(0);

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const specificationsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(product.product_id);
  const isMobile = isMobileUserAgent();

  // Mobile header height - adjust based on your mobile header
  const MOBILE_HEADER_HEIGHT = 60;
  const DESKTOP_OFFSET = 20;
  const stickyOffset = isMobile ? MOBILE_HEADER_HEIGHT : DESKTOP_OFFSET;

  // Store original position of tabs
  useEffect(() => {
    if (tabsRef.current && !originalTabsTop) {
      const rect = tabsRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setOriginalTabsTop(rect.top + scrollTop);
    }
  }, [originalTabsTop]);

  // Improved throttled scroll handler
  const throttledScrollHandler = useCallback(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!tabsRef.current || !specificationsRef.current || !featuresRef.current || !reviewsRef.current) {
        ticking = false;
        return;
      }

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const tabsRect = tabsRef.current.getBoundingClientRect();
      const specsRect = specificationsRef.current.getBoundingClientRect();
      const featuresRect = featuresRef.current.getBoundingClientRect();
      const reviewsRect = reviewsRef.current.getBoundingClientRect();

      // Determine if tabs should be sticky
      const shouldBeSticky = originalTabsTop > 0 && scrollTop >= (originalTabsTop - stickyOffset);
      setIsSticky(shouldBeSticky);

      // Auto-switch tabs based on scroll position with better logic
      const offset = shouldBeSticky ? stickyOffset + 100 : 100;
      
      // Only update active tab if we're not manually clicking
      if (reviewsRect.top <= offset && reviewsRect.top > -reviewsRect.height / 2) {
        setActiveTab('reviews');
      } else if (featuresRect.top <= offset && featuresRect.top > -featuresRect.height / 2) {
        setActiveTab('features');
      } else if (specsRect.top <= offset) {
        setActiveTab('specifications');
      }
      
      ticking = false;
    };

    return () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };
  }, [stickyOffset, originalTabsTop]);

  // Handle sticky tabs and auto-switching with throttling
  useEffect(() => {
    const scrollHandler = throttledScrollHandler();
    window.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', scrollHandler);
    };
  }, [throttledScrollHandler]);

  // Handle tab click scrolling with proper mobile header offset
  const scrollToSection = useCallback((tab: string) => {
    const refs = {
      specifications: specificationsRef,
      features: featuresRef,
      reviews: reviewsRef
    };
    
    const targetRef = refs[tab as keyof typeof refs];
    if (targetRef?.current) {
      const elementPosition = targetRef.current.offsetTop;
      // Adjust offset based on whether tabs will be sticky
      const tabsHeight = tabsRef.current?.offsetHeight || 0;
      const offsetPosition = elementPosition - (stickyOffset + tabsHeight + 20);
      
      // Temporarily disable auto-switching during manual scroll
      setActiveTab(tab);
      
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
  }, [stickyOffset]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, tab: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      scrollToSection(tab);
    }
  }, [scrollToSection]);

  // Parse features with error handling
  const getFeatures = useCallback(() => {
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
  }, [product.features]);

  const features = getFeatures();

  // Parse specifications with error handling
  const getSpecifications = useCallback(() => {
    if (product.specification && typeof product.specification === 'object') {
      return product.specification;
    }
    if (product.attributes && typeof product.attributes === 'object') {
      return product.attributes;
    }
    return {};
  }, [product.specification, product.attributes]);

  const specifications = getSpecifications();

  // Filter reviews
  const getFilteredReviews = useCallback(() => {
    if (reviewFilter === 'all') return reviews;
    const rating = parseInt(reviewFilter);
    return reviews.filter(review => review.rating === rating);
  }, [reviews, reviewFilter]);

  const filteredReviews = getFilteredReviews();

  // Calculate rating distribution
  const getRatingDistribution = useCallback(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  }, [reviews]);

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

  // Handle image errors
  const handleImageError = useCallback((url: string) => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  }, []);

  // Show/hide logic with responsive limits
  const SPECS_LIMIT = isMobile ? 4 : 8;
  const FEATURES_LIMIT = isMobile ? 4 : 6;
  const REVIEWS_LIMIT = isMobile ? 2 : 3;

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
    <div className="mt-8 md:mt-12 mx-auto px-2 md:px-4" ref={tabsContainerRef}>
      {/* Tab Navigation Container */}
      <div className="relative">
        {/* Placeholder to maintain layout when tabs become sticky */}
        {isSticky && (
          <div 
            className="w-full"
            style={{ height: tabsRef.current?.offsetHeight || 0 }}
          />
        )}
        
        {/* Sticky Tab Navigation */}
        <div 
          ref={tabsRef}
          className={`bg-white transition-all duration-200 ease-in-out z-40 ${
            isSticky && isMobile 
              ? 'fixed left-0 right-0 shadow-lg px-4 py-3 border-b border-gray-200' 
              : 'relative py-2'
          }`}
          style={isSticky ? { 
            top: `${stickyOffset}px`,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          } : {}}
          role="tablist"
          aria-label="Product information tabs"
        >
          <div className="max-w mx-auto">
            <div className="grid grid-cols-3 gap-1 md:gap-2 bg-gray-100 p-1 rounded-lg">
              {[
                { key: 'specifications', label: 'Specifications', count: Object.keys(specifications).length },
                { key: 'features', label: 'Features', count: features.length },
                { key: 'reviews', label: isMobile ? 'Reviews' : `Reviews (${totalReviews})`, count: totalReviews }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => scrollToSection(tab.key)}
                  onKeyDown={(e) => handleKeyDown(e, tab.key)}
                  className={`px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-white text-blue-600 shadow-sm scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  aria-controls={`${tab.key}-panel`}
                  tabIndex={0}
                >
                  <span className="block md:hidden">{tab.key}</span>
                  <span className="hidden md:block">
                    {tab.label}
                    {isMobile && tab.key === 'reviews' && totalReviews > 0 && (
                      <span className="text-xs text-gray-500 ml-1">({totalReviews})</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Section */}
      <div 
        ref={specificationsRef} 
        className="mt-6 md:mt-8"
        role="tabpanel"
        id="specifications-panel"
        aria-labelledby="specifications-tab"
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 border-b">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                Specifications
                {Object.keys(specifications).length > 0 && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({Object.keys(specifications).length} items)
                  </span>
                )}
              </h3>
            </div>
            <div className="p-4 md:p-6">
              {Object.keys(specifications).length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                    {visibleSpecs.map(([key, value]) => (
                      <div key={key} className="group">
                        <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg p-3 md:p-4 border border-gray-200">
                          <dt className="font-semibold text-gray-900 mb-1 md:mb-2 text-xs md:text-sm uppercase tracking-wide">
                            {key.replace(/[_-]/g, ' ')}
                          </dt>
                          <dd className="text-gray-700 font-medium text-sm md:text-base break-words">
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
                        aria-expanded={showMoreSpecs}
                        aria-label={showMoreSpecs ? 'Show fewer specifications' : `Show ${Object.entries(specifications).length - SPECS_LIMIT} more specifications`}
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
                <div className="text-center py-8 md:py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 italic">No specifications available for this product.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div 
        ref={featuresRef} 
        className="mt-6 md:mt-8"
        role="tabpanel"
        id="features-panel"
        aria-labelledby="features-tab"
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-6 border-b">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                Features
                {features.length > 0 && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({features.length} items)
                  </span>
                )}
              </h3>
            </div>
            <div className="p-4 md:p-6">
              {features.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {visibleFeatures.map((feature, index) => (
                      <div key={index} className="group">
                        <div className="flex items-start p-3 md:p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg border border-gray-200">
                          <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 md:mr-4 mt-0">
                            <span className="text-blue-600 font-bold text-xs md:text-sm">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-800 leading-relaxed font-medium text-sm md:text-base break-words">
                              {feature}
                            </span>
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
                        aria-expanded={showMoreFeatures}
                        aria-label={showMoreFeatures ? 'Show fewer features' : `Show ${features.length - FEATURES_LIMIT} more features`}
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
                <div className="text-center py-8 md:py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 italic">No features listed for this product.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      <div 
        ref={reviewsRef} 
        className="mt-6 md:mt-8"
        role="tabpanel"
        id="reviews-panel"
        aria-labelledby="reviews-tab"
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 md:p-6 border-b">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
            </div>
            <div className="p-4 md:p-6">
              <div className="space-y-6">
                {/* Review Summary */}
                {totalReviews > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Overall Rating */}
                      <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                          {averageRating.toFixed(1)}
                        </div>
                        <div className="flex justify-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 md:w-5 md:h-5 ${
                                i < Math.floor(averageRating) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <p className="text-gray-600 text-sm md:text-base">
                          Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Rating Distribution */}
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-xs md:text-sm w-6 md:w-8">{rating}★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: totalReviews > 0 
                                    ? `${(ratingDistribution[rating as keyof typeof ratingDistribution] / totalReviews) * 100}%` 
                                    : '0%' 
                                }}
                                role="progressbar"
                                aria-valuenow={ratingDistribution[rating as keyof typeof ratingDistribution]}
                                aria-valuemax={totalReviews}
                                aria-label={`${rating} star rating: ${ratingDistribution[rating as keyof typeof ratingDistribution]} reviews`}
                              />
                            </div>
                            <span className="text-xs md:text-sm text-gray-600 w-6 md:w-8">
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
                      <Filter size={16} className="text-gray-600" aria-hidden="true" />
                      <span className="text-sm font-medium">Filter by rating:</span>
                      <div className="flex gap-1 md:gap-2 flex-wrap">
                        <Button
                          variant={reviewFilter === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setReviewFilter('all')}
                          aria-pressed={reviewFilter === 'all'}
                        >
                          All
                        </Button>
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <Button
                            key={rating}
                            variant={reviewFilter === rating.toString() ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setReviewFilter(rating.toString())}
                            aria-pressed={reviewFilter === rating.toString()}
                          >
                            {rating}★
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviewsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" role="status" aria-label="Loading reviews"></div>
                      <p className="text-gray-600 mt-2">Loading reviews...</p>
                    </div>
                  ) : filteredReviews.length > 0 ? (
                    <>
                      {visibleReviews.map((review) => (
                        <Card key={review.review_id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 md:p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm md:text-base truncate">{review.username}</span>
                                  <div className="flex" role="img" aria-label={`${review.rating} out of 5 stars`}>
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 md:w-4 md:h-4 ${
                                          i < review.rating 
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-300'
                                        }`}
                                        aria-hidden="true"
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs md:text-sm text-gray-600">
                                  {formatDate(review.created_at)}
                                </p>
                              </div>
                              <Badge variant="outline" className="ml-2 flex-shrink-0">{review.rating}/5</Badge>
                            </div>
                            
                            <p className="text-gray-700 mb-4 leading-relaxed text-sm md:text-base break-words">{review.comment}</p>
                            
                            {/* Review Media with error handling */}
                            {review.media_urls && Array.isArray(review.media_urls) && review.media_urls.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto mb-4">
                                {review.media_urls
                                  .filter(url => url && typeof url === 'string' && url.trim() !== '')
                                  .map((url, index) => (
                                    <div key={index} className="flex-shrink-0">
                                      {!imageErrors[url] && (url.includes('video') || url.includes('.mp4') || url.includes('.mov')) ? (
                                        <video
                                          src={url}
                                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg cursor-pointer"
                                          controls
                                          onError={() => handleImageError(url)}
                                        />
                                      ) : !imageErrors[url] ? (
                                        <OptimizedImage
                                          src={url}
                                          alt={`Review image ${index + 1}`}
                                          width={isMobile ? 64 : 80}
                                          height={isMobile ? 64 : 80}
                                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                          onError={() => handleImageError(url)}
                                        />
                                      ) : (
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                          <AlertCircle className="w-4 h-4 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      
                      {filteredReviews.length > REVIEWS_LIMIT && (
                        <div className="text-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowMoreReviews(!showMoreReviews)}
                            className="gap-2"
                            aria-expanded={showMoreReviews}
                            aria-label={showMoreReviews ? 'Show fewer reviews' : `Show ${filteredReviews.length - REVIEWS_LIMIT} more reviews`}
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
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
