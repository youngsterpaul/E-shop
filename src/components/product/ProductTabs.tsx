
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  Play,
  Pause,
} from 'lucide-react';
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

/* ------------------ Media Modal ------------------ */
const MediaModal = ({
  src,
  alt,
  isOpen,
  onClose,
  isVideo,
}: {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
  isVideo?: boolean;
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-full w-full flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
        >
          <X size={20} />
        </Button>

        {isVideo ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
};

/* ------------------ Video Player ------------------ */
const VideoPlayer = ({ src, className }: { src: string; className?: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover rounded-lg"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          className="bg-black bg-opacity-50 text-white hover:bg-opacity-75 rounded-full p-3"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </Button>
      </div>
    </div>
  );
};

/* ------------------ Product Tabs ------------------ */
const ProductTabs = ({ product }: ProductTabsProps) => {
  const [selectedMedia, setSelectedMedia] = useState<{
    src: string;
    alt: string;
    isVideo?: boolean;
  } | null>(null);

  const openMediaModal = useCallback((src: string, alt: string, isVideo = false) => {
    setSelectedMedia({ src, alt, isVideo });
  }, []);
  const closeMediaModal = useCallback(() => setSelectedMedia(null), []);

  const [activeTab, setActiveTab] = useState('specifications');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [showMoreSpecs, setShowMoreSpecs] = useState(false);
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  const [showMoreReviews, setShowMoreReviews] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [originalTabsTop, setOriginalTabsTop] = useState(0);


  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(product.product_id);
  const isMobile = isMobileUserAgent();

  const MOBILE_HEADER_HEIGHT = 48;
  const DESKTOP_OFFSET = 20;
  const stickyOffset = isMobile ? MOBILE_HEADER_HEIGHT : DESKTOP_OFFSET;

  const isVideoUrl = useCallback((url: string) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.ogg'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some((ext) => lowerUrl.includes(ext)) || lowerUrl.includes('video');
  }, []);

  /* Store tabs initial offset */
  useEffect(() => {
    if (tabsRef.current && !originalTabsTop) {
      const rect = tabsRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setOriginalTabsTop(rect.top + scrollTop);
    }
  }, [originalTabsTop]);

  /* Sticky tab scroll handler */
  useEffect(() => {
    const handleScroll = () => {
      if (!tabsRef.current) return;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const shouldBeSticky = originalTabsTop > 0 && scrollTop >= originalTabsTop - stickyOffset;
      setIsSticky(shouldBeSticky);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stickyOffset, originalTabsTop]);

  /* Parse features/specs safely */
  const features = (() => {
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
  })();

  const specifications =
    (product.specification && typeof product.specification === 'object'
      ? product.specification
      : product.attributes && typeof product.attributes === 'object'
      ? product.attributes
      : {}) || {};

  /* Reviews filter + stats */
  const filteredReviews =
    reviewFilter === 'all'
      ? reviews
      : reviews.filter((r) => r.rating === parseInt(reviewFilter));
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => (ratingDistribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1));

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

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const specificationsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

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

  /* Limits */
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
    <>
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
                ? 'fixed left-0 right-0 shadow-lg px-2 py-0 border-b border-gray-200' 
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
              <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 .rounded-lg">
                {[
                  { key: 'specifications', label: 'Specifications', count: Object.keys(specifications).length },
                  { key: 'features', label: 'Features', count: features.length },
                  { key: 'reviews', label: isMobile ? 'Reviews' : `Reviews (${totalReviews})`, count: totalReviews }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => scrollToSection(tab.key)}
                    onKeyDown={(e) => handleKeyDown(e, tab.key)}
                    className={`px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium .rounded-md transition-all duration-200 ${
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
              <div className="p-2 md:p-4 border-b">
                <h3 className="text-md font-medium text-gray-900 mb-2">
                  Specifications
                  {Object.keys(specifications).length > 0 && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ({Object.keys(specifications).length} items)
                    </span>
                  )}
                </h3>
              </div>

              <div className="pb-4 .md:p-6 text-[13px] md:text-[14px]"> {/* ↓ smaller font size */}
                {Object.keys(specifications).length > 0 ? (
                  <div className="space-y-4">
                    
                    {/* ✅ Table-like structure */}
                    <div className="w-full border border-gray-200 overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {visibleSpecs.map(([key, value]) => (
                          <div
                            key={key}
                            className="grid grid-cols-3 md:grid-cols-4 items-center hover:bg-gray-50 transition-colors"
                          >
                            <dt className="col-span-1 bg-gray-50 font-semibold text-gray-800 px-3 py-2 uppercase tracking-wide text-[11px] md:text-[12px] border-r border-gray-200">
                              {key.replace(/[_-]/g, ' ')}
                            </dt>
                            <dd className="col-span-2 md:col-span-3 text-gray-700 px-3 py-2 font-medium break-words">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </dd>
                          </div>
                        ))}
                      </div>
                    </div>

                    {Object.entries(specifications).length > SPECS_LIMIT && (
                      <div className="text-center pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setShowMoreSpecs(!showMoreSpecs)}
                          className="gap-2 text-sm"
                          size="sm"
                          aria-label={
                            showMoreSpecs
                              ? 'Show fewer specifications'
                              : `Show ${
                                  Object.entries(specifications).length - SPECS_LIMIT
                                } more specifications`
                          }
                        >
                          {showMoreSpecs ? (
                            <>
                              <ChevronUp size={14} />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} />
                              Show More (
                              {Object.entries(specifications).length - SPECS_LIMIT} more)
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 italic text-sm">
                      No specifications available for this product.
                    </p>
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
              {/* Header */}
              <div className="p-2 md:p-4 border-b">
                <h3 className="text-md font-medium text-gray-900 mb-2">
                  Features
                  {features.length > 0 && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ({features.length} items)
                    </span>
                  )}
                </h3>
              </div>

              {/* Content */}
              <div className="pb-4 .md:p-6 text-[13px] md:text-[14px]">
                {features.length > 0 ? (
                  <div className="space-y-4">

                    {/* ✅ Table-like structure */}
                    <div className="w-full border border-gray-200 overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {visibleFeatures.map((feature, index) => (
                          <div
                            key={index}
                            className={`grid grid-cols-[40px_1fr] md:grid-cols-[50px_1fr] items-center ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            } hover:bg-gray-100 transition-colors`}
                          >
                            {/* Number */}
                            <div className="text-center font-semibold text-blue-600 px-2 py-2 border-r border-gray-200 text-[12px] md:text-[13px]">
                              {index + 1}
                            </div>

                            {/* Feature text */}
                            <div className="text-gray-800 px-3 py-2 font-medium leading-relaxed break-words">
                              {feature}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Show More / Less Button */}
                    {features.length > FEATURES_LIMIT && (
                      <div className="text-center pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setShowMoreFeatures(!showMoreFeatures)}
                          className="gap-2 text-sm"
                          size="sm"
                          aria-expanded={showMoreFeatures}
                          aria-label={
                            showMoreFeatures
                              ? 'Show fewer features'
                              : `Show ${features.length - FEATURES_LIMIT} more features`
                          }
                        >
                          {showMoreFeatures ? (
                            <>
                              <ChevronUp size={14} />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} />
                              Show More ({features.length - FEATURES_LIMIT} more)
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 italic text-sm">
                      No features listed for this product.
                    </p>
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
              <div className="p-2 md:p-6 border-b">
                <h3 className="text-md font-medium text-gray-900 mb-2">Customer Reviews</h3>
              </div>
              <div className="pb-4 .md:p-6">
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
                              
                              {/* Enhanced Review Media with click handlers */}
                              {review.media_urls && Array.isArray(review.media_urls) && review.media_urls.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto mb-4">
                                  {review.media_urls
                                    .filter(url => url && typeof url === 'string' && url.trim() !== '')
                                    .map((url, index) => (
                                      <div key={index} className="flex-shrink-0">
                                       {!imageErrors[url] && isVideoUrl(url) ? (
                                          <div
                                            onClick={() => openMediaModal(url, `Review video ${index + 1}`, true)}
                                            className="cursor-pointer"
                                          >
                                            <video
                                              src={url}
                                              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg hover:opacity-80 transition-opacity"
                                              onError={() => handleImageError(url)}
                                            />
                                          </div>
                                        ) : !imageErrors[url] ? (
                                          <div
                                            onClick={() => openMediaModal(url, `Review image ${index + 1}`)}
                                            className="cursor-pointer"
                                          >
                                            <OptimizedImage
                                              src={url}
                                              alt={`Review image ${index + 1}`}
                                              width={isMobile ? 64 : 80}
                                              height={isMobile ? 64 : 80}
                                              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg hover:opacity-80 transition-opacity"
                                              onError={() => handleImageError(url)}
                                            />
                                          </div>
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
                            size="sm"
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

    {selectedMedia && (
      <MediaModal
        src={selectedMedia.src}
        alt={selectedMedia.alt}
        isOpen={!!selectedMedia}
        onClose={closeMediaModal}
        isVideo={selectedMedia.isVideo}
      />
    )}
    </>
  );
};

export default ProductTabs;
