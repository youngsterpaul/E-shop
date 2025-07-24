import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Video, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { isMobileUserAgent } from '@/hooks/use-mobile';
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  
  const isMobile = isMobileUserAgent();
  const mainImageRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const magnifierRef = useRef<HTMLDivElement>(null);
  
  const allMedia = [
    product.image,
    ...(product.images?.filter(img => img !== product.image) || []),
    ...(product.video ? [product.video] : [])
  ];

  const minSwipeDistance = 50;
  const magnifierSize = 200; // Size of the magnifier lens
  const zoomLevel = 2.5; // Zoom level for magnification

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % allMedia.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const isVideo = (url: string) => {
    return url === product.video;
  };

  const handleThumbnailClick = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
    
    if (thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[index] as HTMLElement;
      thumbnail?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    
    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  const handleImageClick = () => {
    if (!isVideo(allMedia[currentIndex]) && !showMagnifier) {
      setIsZoomOpen(true);
    }
  };

  // Handle mouse movement for magnifier
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current || isVideo(allMedia[currentIndex]) || isMobile) return;

    const rect = mainImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate magnifier position (center it on cursor)
    const magnifierX = Math.max(magnifierSize / 2, Math.min(rect.width - magnifierSize / 2, x));
    const magnifierY = Math.max(magnifierSize / 2, Math.min(rect.height - magnifierSize / 2, y));

    // Calculate the position in the zoomed image
    const imageX = (x / rect.width) * 100;
    const imageY = (y / rect.height) * 100;

    setMagnifierPosition({ x: magnifierX, y: magnifierY });
    setImagePosition({ x: imageX, y: imageY });
  };

  const handleMouseEnter = () => {
    if (!isVideo(allMedia[currentIndex]) && !isMobile) {
      setShowMagnifier(true);
    }
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
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
        className={`relative aspect-square bg-white overflow-hidden mx-auto cursor-pointer group ${isMobile ? 'w-full' : 'w-1/3'}`}
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
        onMouseMove={!isMobile ? handleMouseMove : undefined}
        onMouseEnter={!isMobile ? handleMouseEnter : undefined}
        onMouseLeave={!isMobile ? handleMouseLeave : undefined}
        onClick={handleImageClick}
        role="button"
        aria-label="View image in full screen"
        tabIndex={0}
      >
        {isVideo(allMedia[currentIndex]) ? (
          <video
            src={allMedia[currentIndex]}
            controls
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isTransitioning ? 'scale-105' : 'scale-100'
            }`}
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
              className={`w-full h-full object-cover transition-all duration-300 ${
                isTransitioning ? 'scale-105 opacity-90' : 'scale-100 opacity-100'
              }`}
              priority={currentIndex === 0}
            />

            {/* Magnifier Lens - Desktop Only */}
            {!isMobile && showMagnifier && (
              <>
                {/* Magnifier Lens Overlay */}
                <div
                  className="absolute pointer-events-none border-2 border-white shadow-lg rounded-full bg-white/20 backdrop-blur-sm z-10"
                  style={{
                    width: `${magnifierSize}px`,
                    height: `${magnifierSize}px`,
                    left: `${magnifierPosition.x - magnifierSize / 2}px`,
                    top: `${magnifierPosition.y - magnifierSize / 2}px`,
                    boxShadow: '0 0 0 2px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2)',
                  }}
                />

                {/* Magnified Image */}
                <div
                  ref={magnifierRef}
                  className="absolute pointer-events-none border-2 border-white shadow-xl rounded-full overflow-hidden z-20 bg-white"
                  style={{
                    width: `${magnifierSize}px`,
                    height: `${magnifierSize}px`,
                    left: `${magnifierPosition.x - magnifierSize / 2}px`,
                    top: `${magnifierPosition.y - magnifierSize / 2}px`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,255,255,0.8)',
                  }}
                >
                  <OptimizedImage
                    src={allMedia[currentIndex]}
                    alt={`${product.name} - Magnified view`}
                    width={500 * zoomLevel}
                    height={500 * zoomLevel}
                    aspectRatio="square"
                    className="absolute object-cover"
                    style={{
                      width: `${magnifierSize * zoomLevel}px`,
                      height: `${magnifierSize * zoomLevel}px`,
                      left: `-${(imagePosition.x / 100) * magnifierSize * zoomLevel - magnifierSize / 2}px`,
                      top: `-${(imagePosition.y / 100) * magnifierSize * zoomLevel - magnifierSize / 2}px`,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Kilimall-style Image Counter - Inside Image */}
        {allMedia.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
            {currentIndex + 1}/{allMedia.length}
          </div>
        )}

        {/* Magnify Icon Indicator - Desktop Only */}
        {!isMobile && !isVideo(allMedia[currentIndex]) && !showMagnifier && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ZoomIn size={16} />
          </div>
        )}
      </div>

      {/* Thumbnail Strip - Desktop Only */}
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
              disabled={isTransitioning}
              className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                currentIndex === index 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${isTransitioning ? 'opacity-50' : ''}`}
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
    </div>
  );
};

export default EnhancedProductImageGallery;