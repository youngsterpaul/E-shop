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
}

const EnhancedProductImageGallery = ({ product }: EnhancedProductImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [showLens, setShowLens] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const isMobile = isMobileUserAgent();
  const minSwipe = 50;

  /** ✅ Combine product media (main image → other images → video) */
  const allMedia = useMemo(() => {
    const imgs = [product.image, ...(product.images?.filter((img) => img !== product.image) || [])];
    return product.video ? [...imgs, product.video] : imgs;
  }, [product.image, product.images, product.video]);

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

  /** ✅ Mouse wheel navigation (desktop) */
  useEffect(() => {
    if (isMobile || !mainRef.current) return;
    const node = mainRef.current;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) next();
      if (e.deltaY < 0) prev();
    };
    node.addEventListener("wheel", onWheel, { passive: true });
    return () => node.removeEventListener("wheel", onWheel);
  }, [isMobile, next, prev]);

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

  /** ✅ Magnifier (desktop) */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainRef.current) return;
    const { left, top, width, height } = mainRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    requestAnimationFrame(() => setZoomPos({ x, y }));
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
      {/* Main Media */}
      <div className="flex-1 max-w-lg w-full">
        <div
          ref={mainRef}
          className="relative bg-white overflow-hidden border rounded-lg cursor-zoom-in"
          style={{ aspectRatio: "1/1", maxWidth: "500px" }}
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
            <div className="relative w-full h-full">
              <OptimizedImage
                src={allMedia[currentIndex]}
                alt={product.name}
                width={1200}
                height={1200}
                aspectRatio="square"
                className="w-full h-full object-contain"
                priority={currentIndex === 0}
              />
              {showLens && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url(${allMedia[currentIndex]})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "200% 200%",
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  }}
                >
                  <div
                    className="absolute rounded-full border-2 border-gray-300 shadow-md pointer-events-none"
                    style={{
                      top: `${zoomPos.y}%`,
                      left: `${zoomPos.x}%`,
                      transform: "translate(-50%, -50%)",
                      width: "150px",
                      height: "150px",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {allMedia.length > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-3 mt-2 overflow-x-auto max-w-full scrollbar-hide snap-x"
        >
          {allMedia.map((media, i) => (
            <button
              key={i}
              onClick={() => changeImage(i)}
              className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 snap-center ${
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
