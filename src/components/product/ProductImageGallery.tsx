
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import OptimizedImage from '../OptimizedImage';

interface ProductImageGalleryProps {
  product: {
    id: string;
    name: string;
    image: string;
    images?: string[];
    video?: string;
  };
}

const ProductImageGallery = ({ product }: ProductImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = isMobileUserAgent();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const allMedia = [
    product.image,
    ...(product.images || []),
    ...(product.video ? [product.video] : [])
  ];

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
    if (isMobile && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = 88;
      const scrollPosition = index * itemWidth - container.clientWidth / 2 + itemWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

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

  return (
    <div className="space-y-4">
      <div 
        className="relative aspect-square bg-white rounded-lg overflow-hidden"
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
      >
        {isVideo(allMedia[currentIndex]) ? (
          <video
            src={allMedia[currentIndex]}
            controls
            className="w-full h-full object-cover"
            poster={product.image}
          />
        ) : (
          <OptimizedImage
            src={allMedia[currentIndex]}
            alt={product.name}
            width={600}
            height={600}
            aspectRatio="square"
            className="w-full h-full object-cover"
            priority={currentIndex === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
        
        {allMedia.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={prevImage}
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={nextImage}
            >
              <ChevronRight size={20} />
            </Button>
          </>
        )}

        {isMobile && allMedia.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {allMedia.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  currentIndex === index ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {allMedia.length > 1 && (
        <div 
          ref={scrollContainerRef}
          className={`flex gap-2 ${
            isMobile ? 'overflow-x-auto scrollbar-hide' : 'overflow-x-auto'
          } pb-2`}
        >
          {allMedia.map((media, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                currentIndex === index ? 'border-primary' : 'border-gray-200'
              }`}
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
                  alt={`${product.name} ${index + 1}`}
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

export default ProductImageGallery;
