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
  const magnifierSize = 200;
  const zoomLevel = 2.5;

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current || isVideo(allMedia[currentIndex]) || isMobile) return;

    const rect = mainImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Keep magnifier within bounds
    const magnifierX = Math.max(magnifierSize / 2, Math.min(rect.width - magnifierSize / 2, x));
    const magnifierY = Math.max(magnifierSize / 2, Math.min(rect.height - magnifierSize / 2, y));

    // Calculate percentage position for the zoomed image
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


  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Mobile Main Image */}
        <div 
          ref={mainImageRef}
          className="relative aspect-square bg-white overflow-hidden w-full cursor-pointer"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={handleImageClick}
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
          )}
          
          {/* Mobile Image Counter */}
          {allMedia.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-sm font-medium">
              {currentIndex + 1}/{allMedia.length}
            </div>
          )}


        </div>
      </div>
    );
  }

// Desktop Kilimall-exact style layout
return (
  <div className="flex flex-col gap-4 w-full items-center">
    
    {/* Main Image */}
    <div className="flex-1 max-w-lg w-full">
      <div 
        ref={mainImageRef}
        className="relative bg-white overflow-hidden cursor-pointer group border rounded-lg"
        style={{ 
          aspectRatio: '1/1',
          maxWidth: '500px',
          width: '100%',
          height: 'auto'
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleImageClick}
      >
        {isVideo(allMedia[currentIndex]) ? (
          <video
            src={allMedia[currentIndex]}
            controls
            className={`w-full h-full object-contain transition-transform duration-300 ${
              isTransitioning ? 'scale-105' : 'scale-100'
            }`}
            poster={product.image}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-gray-50">
            <OptimizedImage
              src={allMedia[currentIndex]}
              alt={`${product.name} - Image ${currentIndex + 1}`}
              width={500}
              height={500}
              aspectRatio="square"
              className={`max-w-full max-h-full object-contain transition-all duration-300 ${
                isTransitioning ? 'scale-105 opacity-90' : 'scale-100 opacity-100'
              }`}
              priority={currentIndex === 0}
            />
          </div>
        )}

        {/* Desktop Image Counter */}
        {allMedia.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1}/{allMedia.length}
          </div>
        )}

        {/* Zoom Icon */}
        {!isVideo(allMedia[currentIndex]) && !showMagnifier && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ZoomIn size={16} />
          </div>
        )}
      </div>
    </div>

    {/* Thumbnails Below Main Image */}
    {allMedia.length > 1 && (
      <div 
        ref={thumbnailsRef}
        className="flex flex-row gap-3 mt-2 overflow-x-auto max-w-full scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allMedia.map((media, index) => (
          <button
            key={index}
            onClick={() => handleThumbnailClick(index)}
            disabled={isTransitioning}
            className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
              currentIndex === index 
                ? 'border-orange-500 ring-2 ring-orange-200' 
                : 'border-gray-200 hover:border-gray-300'
            } ${isTransitioning ? 'opacity-50' : ''}`}
          >
            {isVideo(media) ? (
              <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                <Video size={16} className="text-gray-600 z-10" />
                <OptimizedImage
                  src={product.image}
                  alt="Video thumbnail"
                  width={80}
                  height={80}
                  aspectRatio="square"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
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

    {/* Zoom Dialog */}
    <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
      <DialogContent className="max-w-4xl w-full h-full max-h-screen p-0 bg-black">
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full z-50"
            onClick={() => setIsZoomOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          
          {!isVideo(allMedia[currentIndex]) && (
            <OptimizedImage
              src={allMedia[currentIndex]}
              alt={`${product.name} - Zoomed view`}
              width={1000}
              height={1000}
              aspectRatio="square"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  </div>
);
}

export default EnhancedProductImageGallery;