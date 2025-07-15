
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Video, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { isMobileUserAgent, useIsMobile } from '@/hooks/use-mobile';
import OptimizedImage from '../OptimizedImage';

interface EnhancedProductImageGalleryProps {
  product: {
    id: string;
    name: string;
    image: string;
    images?: string[];
    video?: string;
  };
}

const EnhancedProductImageGallery = ({ product }: EnhancedProductImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const isMobile = isMobileUserAgent();
  const mainImageRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  
  const allMedia = [
    product.image,
    ...(product.images?.filter(img => img !== product.image) || []),
    ...(product.video ? [product.video] : [])
  ];

  const minSwipeDistance = 0;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % allMedia.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const isVideo = (url: string) => {
    return url === product.video;
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
    // Scroll thumbnail into view
    if (thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[index] as HTMLElement;

    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < allMedia.length - 1) nextImage();
    if (isRightSwipe && currentIndex > 0) prevImage();
  };

  const handleImageClick = () => {
    if (!isVideo(allMedia[currentIndex])) {
      setIsZoomOpen(true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') setIsZoomOpen(false);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div 
        ref={mainImageRef}
        className={`relative aspect-square bg-white overflow-hidden mx-auto cursor-pointer group ${isMobile ? 'w-full' : 'max-w-[320px]'}`}
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
        onClick={handleImageClick}
        role="button"
        aria-label="View image in full screen"
        tabIndex={0}
      >
        {isVideo(allMedia[currentIndex]) ? (
          <video
            src={allMedia[currentIndex]}
            controls
            className="w-full h-full object-cover"
            poster={product.image}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="relative w-full h-full">
            <OptimizedImage
              src={allMedia[currentIndex]}
              alt={`${product.name} - Image ${currentIndex + 1}`}
              width={500}
              height={500}
              aspectRatio="square"
              //className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              priority={currentIndex === 0}
              //sizes="(max-width: 768px) 100vw, 500px"
            />
            
            {/* Zoom Icon Overlay 
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={32} />
            </div>
            */}
          </div>
        )}
        
        {/* Navigation Arrows 
        {allMedia.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </Button>
          </>
        )}
*/}
      </div>

      {/* Image Indicators for Mobile */}
      {isMobile && allMedia.length > 1 && (
        <div className="flex justify-center gap-2">
          {allMedia.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                currentIndex === index ? 'bg-primary' : 'bg-gray-300'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail Strip */}
      {!isMobile && allMedia.length > 1 && (
        <div 
          ref={thumbnailsRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {allMedia.map((media, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                currentIndex === index 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`View ${isVideo(media) ? 'video' : `image ${index + 1}`}`}
            >
              {isVideo(media) ? (
                <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                  <Video size={16} className="text-gray-600" />
                  <OptimizedImage
                    src={product.image}
                    alt="Video thumbnail"
                    width={80}
                    height={80}
                    aspectRatio="square"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                </div>
              ) : (
                <OptimizedImage
                  src={media}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  width={80}
                  height={80}
                  aspectRatio="square"
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal 
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max max-h-[90vh] p-0 bg-black/90">
          <div className="relative w-full h-full flex items-center justify-center">  
            <OptimizedImage
              src={allMedia[currentIndex]}
              alt={`${product.name} - Zoomed view`}
              className="max-w-full max-h-full object-contain"
              width={800}
              height={800}
            />
            
            {allMedia.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={32} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight size={32} />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog> */}
    </div>
  );
};

export default EnhancedProductImageGallery;
