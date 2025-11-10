import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Video } from "lucide-react";
import { isMobileUserAgent } from "@/hooks/use-mobile";
import OptimizedImage from "../OptimizedImage";

interface EnhancedProductImageGalleryProps {
  product: {
    id: string;
    name: string;
    image: string;
    images?: string[];
    video?: string;
  };
  selectedImageUrl?: string;
  variantImages?: Array<{ url: string; label: string }>; // Color variant images
}

const EnhancedProductImageGallery = ({ product, selectedImageUrl, variantImages = [] }: EnhancedProductImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const isMobile = isMobileUserAgent();
  const minSwipe = 50;
  
  // Zoom configuration
  const lensSize = 220;
  const zoomLevel = 1.8;

  /** ✅ Combine product media (main image → color variants → other images → video) */
  const allMedia = useMemo(() => {
    const imgs = [product.image];
    
    // Add color variant images first (they are more important for user selection)
    if (variantImages.length > 0) {
      variantImages.forEach(variant => {
        if (variant.url && !imgs.includes(variant.url)) {
          imgs.push(variant.url);
        }
      });
    }
    
    // Add other product images
    product.images?.forEach(img => {
      if (img !== product.image && !imgs.includes(img)) {
        imgs.push(img);
      }
    });
    
    return product.video ? [...imgs, product.video] : imgs;
  }, [product.image, product.images, product.video, variantImages]);

  // If a selected image is provided (e.g., from color variant), switch to it
  useEffect(() => {
    if (!selectedImageUrl) return;
    const idx = allMedia.findIndex((m) => m === selectedImageUrl);
    if (idx >= 0 && idx !== currentIndex) {
      setCurrentIndex(idx);
    }
  }, [selectedImageUrl, allMedia, currentIndex]);

  const isVideo = useCallback((url: string) => url === product.video, [product.video]);

  /** ✅ Change image */
  const changeImage = useCallback(
    (idx: number) => {
      if (idx === currentIndex) return;
      setCurrentIndex(idx);
      thumbsRef.current?.children[idx]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    },
    [currentIndex]
  );

  const next = useCallback(() => changeImage((currentIndex + 1) % allMedia.length), [currentIndex, allMedia.length, changeImage]);
  const prev = useCallback(() => changeImage((currentIndex - 1 + allMedia.length) % allMedia.length), [currentIndex, allMedia.length, changeImage]);

  /** ✅ Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  /** ✅ Preload next/prev images */
  useEffect(() => {
    const preload = (src: string) => {
      if (!isVideo(src)) {
        const img = new Image();
        img.src = src;
      }
    };
    const nextIdx = (currentIndex + 1) % allMedia.length;
    const prevIdx = (currentIndex - 1 + allMedia.length) % allMedia.length;
    preload(allMedia[nextIdx]);
    preload(allMedia[prevIdx]);
  }, [currentIndex, allMedia, isVideo]);

  /** ✅ Touch swipe (mobile) */
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const dist = touchStartX - e.changedTouches[0].clientX;
    if (dist > minSwipe) next();
    if (dist < -minSwipe) prev();
    setTouchStartX(null);
  };

  /** ✅ Kilimall-style Magnifier (desktop) */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainRef.current) return;
    const { left, top, width, height } = mainRef.current.getBoundingClientRect();
    
    // Mouse position relative to image
    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;
    
    // Lens position (centered on cursor, bounded within image)
    const lensX = Math.max(0, Math.min(mouseX - lensSize / 2, width - lensSize));
    const lensY = Math.max(0, Math.min(mouseY - lensSize / 2, height - lensSize));
    
    // Zoom position for magnified view (centered on cursor position)
    const x = (mouseX / width) * 100;
    const y = (mouseY / height) * 100;
    
    requestAnimationFrame(() => {
      setLensPos({ x: lensX, y: lensY });
      setZoomPos({ x, y });
    });
    setShowLens(true);
  };
  
  const handleMouseLeave = () => setShowLens(false);

  /* =================== MOBILE =================== */
  if (isMobile) {
    return (
      <div className="space-y-3">
        <div
          ref={mainRef}
          className="relative aspect-square w-full bg-white overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isVideo(allMedia[currentIndex]) ? (
            <video
              src={allMedia[currentIndex]}
              controls
              className="w-full h-full object-cover"
              poster={product.image}
              preload="metadata"
            />
          ) : (
            <OptimizedImage
              src={allMedia[currentIndex]}
              alt={product.name}
              width={800}
              height={800}
              aspectRatio="square"
              className="w-full h-full object-cover"
              priority={currentIndex === 0}
            />
          )}
          {allMedia.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-sm">
              {currentIndex + 1}/{allMedia.length}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =================== DESKTOP =================== */
  return (
    <div className="flex flex-col gap-4 items-center w-full">
      {/* Main Image Container (relative for positioning the zoom modal) */}
      <div className="relative flex justify-center items-start w-full max-w-[500px]">
        {/* ✅ Main Image */}
        <div
          ref={mainRef}
          className="relative bg-white overflow-hidden /border /rounded-lg cursor-pointer w-full"
          style={{ aspectRatio: "1/1" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {isVideo(allMedia[currentIndex]) ? (
            <video
              src={allMedia[currentIndex]}
              controls
              className="w-full h-full object-contain"
              poster={product.image}
              preload="metadata"
            />
          ) : (
            <OptimizedImage
              src={allMedia[currentIndex]}
              alt={product.name}
              width={1200}
              height={1200}
              aspectRatio="square"
              className="w-full h-full object-contain"
              priority={currentIndex === 0}
            />
          )}
          
          {/* ✅ Lens Overlay (follows cursor) */}
          {showLens && !isVideo(allMedia[currentIndex]) && (
            <div
              className="absolute border-2 border-gray-200 shadow-lg pointer-events-none"
              style={{
                width: `${lensSize}px`,
                height: `${lensSize}px`,
                left: `${lensPos.x}px`,
                top: `${lensPos.y}px`,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                //boxShadow: "0 0 0 2000px rgba(0, 0, 0, 0.3)",
              }}
            />
          )}
        </div>

        {/* ✅ Floating Zoom Preview (absolute on the right) */}
        {showLens && !isVideo(allMedia[currentIndex]) && (
          <div
            className="hidden md:block absolute top-0 right-[-420px] w-[400px] h-[500px] border-2 border-gray-300 /rounded-lg overflow-hidden /shadow-xl bg-white z-50"
            style={{
              backgroundImage: `url(${allMedia[currentIndex]})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${zoomLevel * 100}% ${zoomLevel * 100}%`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
          />
        )}
      </div>

      {/* ✅ Thumbnails */}
      {allMedia.length > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-3 mt-2 overflow-x-auto max-w-full scrollbar-hide snap-x"
        >
          {allMedia.map((media, i) => (
            <button
              key={i}
              onClick={() => changeImage(i)}
              className={`relative w-20 h-20 /rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 snap-center ${
                currentIndex === i
                  ? "border-green-500 ring-2 ring-green-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              aria-label={`View image ${i + 1}`}
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
                  alt={`thumb-${i}`}
                  width={80}
                  height={80}
                  aspectRatio="square"
                  className="w-full h-full object-cover"
                  loading="lazy"
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