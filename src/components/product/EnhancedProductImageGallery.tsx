import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
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
  variantImages?: Array<{ url: string; label: string }>;
}

const MAIN_SIZE = 450;
const ZOOM_FACTOR = 3;
const LENS_SIZE = 150;
const ZOOM_PANEL_SIZE = MAIN_SIZE;
const LARGE_SIZE = MAIN_SIZE * ZOOM_FACTOR;

const EnhancedProductImageGallery = ({
  product,
  selectedImageUrl,
  variantImages = [],
}: EnhancedProductImageGalleryProps) => {
  const isMobile = isMobileUserAgent();

  const isVideo = useCallback(
    (url: string) => {
      if (!url) return false;
      const videoExtensions = [".mp4", ".webm", ".mov", ".m4v"];
      return (
        videoExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
        url === product.video
      );
    },
    [product.video]
  );

  // Desktop includes variant images; mobile does NOT
  const desktopRawMedia = useMemo(() => {
    const imgs = [
      product.image,
      ...(product.images || []),
      ...variantImages.map((v) => v.url),
    ];
    const unique = Array.from(new Set(imgs)).filter(Boolean);
    const final = product.video ? [...unique, product.video] : unique;
    return final.sort((a, b) => {
      const av = isVideo(a), bv = isVideo(b);
      return av === bv ? 0 : av ? -1 : 1;
    });
  }, [product, variantImages, isVideo]);

  const mobileRawMedia = useMemo(() => {
    const imgs = [product.image, ...(product.images || [])];
    const unique = Array.from(new Set(imgs)).filter(Boolean);
    const final = product.video ? [...unique, product.video] : unique;
    return final.sort((a, b) => {
      const av = isVideo(a), bv = isVideo(b);
      return av === bv ? 0 : av ? -1 : 1;
    });
  }, [product, isVideo]);

  const rawMedia = isMobile ? mobileRawMedia : desktopRawMedia;

  const mobileMedia = useMemo(() => {
    if (mobileRawMedia.length <= 1) return mobileRawMedia;
    return [
      mobileRawMedia[mobileRawMedia.length - 1],
      ...mobileRawMedia,
      mobileRawMedia[0],
    ];
  }, [mobileRawMedia]);

  // ── States ──
  const [currentIndex, setCurrentIndex] = useState(
    isMobile ? (mobileRawMedia.length > 1 ? 1 : 0) : 0
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [zoomTranslate, setZoomTranslate] = useState({ x: 0, y: 0 });
  const [zoomPanelSide, setZoomPanelSide] = useState<"right" | "left">("right");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Mobile swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startTime = useRef<number>(0);

  const mainRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  // Track the last selectedImageUrl we acted on, so we only
  // jump to the variant image when the variant actually changes —
  // not when the user manually clicks a thumbnail
  const lastAppliedVariantUrl = useRef<string | undefined>(undefined);

  // ── selectedImageUrl: only jump when variant prop actually changes ──
  useEffect(() => {
    if (isMobile) return;
    if (!selectedImageUrl) return;
    if (selectedImageUrl === lastAppliedVariantUrl.current) return;

    lastAppliedVariantUrl.current = selectedImageUrl;
    const idx = desktopRawMedia.indexOf(selectedImageUrl);
    if (idx !== -1) setCurrentIndex(idx);
  }, [selectedImageUrl, desktopRawMedia, isMobile]);

  // If the variant list shrinks and currentIndex is now out of bounds, clamp it
  useEffect(() => {
    if (isMobile) return;
    setCurrentIndex((prev) =>
      prev >= desktopRawMedia.length ? Math.max(0, desktopRawMedia.length - 1) : prev
    );
  }, [desktopRawMedia.length, isMobile]);

  // Play/pause on slide change
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (idx === currentIndex) {
        video.play().catch(() => {});
        setIsPlaying(true);
      } else {
        video.pause();
      }
    });
  }, [currentIndex]);

  // Scroll active thumbnail into view (desktop)
  useEffect(() => {
    if (isMobile || !thumbnailStripRef.current) return;
    const strip = thumbnailStripRef.current;
    const activeThumb = strip.children[currentIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex, isMobile]);

  const togglePlay = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const currentVideo = videoRefs.current.get(currentIndex);
    if (!currentVideo) return;
    if (currentVideo.paused) {
      currentVideo.play();
      setIsPlaying(true);
    } else {
      currentVideo.pause();
      setIsPlaying(false);
    }
  };

  /* ── Infinite-loop jump repair (mobile only) ── */
  useEffect(() => {
    if (!isMobile || isDragging) return;
    if (currentIndex === 0) {
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(mobileMedia.length - 2);
      }, 300);
      return () => clearTimeout(t);
    }
    if (currentIndex === mobileMedia.length - 1) {
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(1);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [currentIndex, isMobile, isDragging, mobileMedia.length]);

  /* ── Mobile swipe handlers ── */
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    startTime.current = Date.now();
    setIsDragging(true);
    setIsTransitioning(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setDragOffset(e.targetTouches[0].clientX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    const duration = Date.now() - startTime.current;
    const velocity = Math.abs(dragOffset) / duration;
    setIsDragging(false);
    setIsTransitioning(true);
    if (Math.abs(dragOffset) > 50 || velocity > 0.5) {
      setCurrentIndex((prev) => (dragOffset < 0 ? prev + 1 : prev - 1));
      if (window.navigator.vibrate) window.navigator.vibrate(5);
    }
    setDragOffset(0);
    setTouchStartX(null);
  };

  /* ── Desktop zoom handlers ── */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainRef.current || isVideo(rawMedia[currentIndex])) return;
    const { left, top, width, height } =
      mainRef.current.getBoundingClientRect();
    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;

    const clampedLensX = Math.max(0, Math.min(mouseX - LENS_SIZE / 2, width - LENS_SIZE));
    const clampedLensY = Math.max(0, Math.min(mouseY - LENS_SIZE / 2, height - LENS_SIZE));
    setLensPos({ x: clampedLensX, y: clampedLensY });

    const rawTx = ZOOM_PANEL_SIZE / 2 - mouseX * ZOOM_FACTOR;
    const rawTy = ZOOM_PANEL_SIZE / 2 - mouseY * ZOOM_FACTOR;
    const minTx = ZOOM_PANEL_SIZE - LARGE_SIZE;
    const minTy = ZOOM_PANEL_SIZE - LARGE_SIZE;
    setZoomTranslate({
      x: Math.min(0, Math.max(minTx, rawTx)),
      y: Math.min(0, Math.max(minTy, rawTy)),
    });

    const spaceOnRight = window.innerWidth - (e.clientX - mouseX + width);
    setZoomPanelSide(spaceOnRight >= ZOOM_PANEL_SIZE + 24 ? "right" : "left");
    setShowLens(true);
  };

  /* ═══════════════════════════════════════════
     RENDER — MOBILE
  ═══════════════════════════════════════════ */
  if (isMobile) {
    const activeDotIndex = (() => {
      if (currentIndex === 0) return mobileRawMedia.length - 1;
      if (currentIndex === mobileMedia.length - 1) return 0;
      return currentIndex - 1;
    })();

    return (
      <div className="w-full bg-white overflow-hidden">
        <div
          className="relative aspect-square touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`flex h-full w-full ${
              isTransitioning ? "transition-transform duration-300 ease-out" : ""
            }`}
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
            }}
          >
            {mobileMedia.map((media, i) => (
              <div
                key={`${media}-${i}`}
                className="w-full h-full flex-shrink-0 relative bg-black"
              >
                {isVideo(media) ? (
                  <div className="relative w-full h-full" onClick={togglePlay}>
                    <video
                      ref={(el) => { if (el) videoRefs.current.set(i, el); }}
                      src={media}
                      className="w-full h-full object-contain"
                      playsInline
                      loop
                      muted={isMuted}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {!isPlaying && (
                        <div className="p-4 bg-black/40 rounded-full backdrop-blur-sm">
                          <Play className="text-white w-8 h-8 fill-current" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                      className="absolute bottom-16 right-4 p-2 bg-black/50 rounded-full text-white"
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>
                ) : (
                  <OptimizedImage
                    src={media}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full">
            {mobileRawMedia.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeDotIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — DESKTOP
  ═══════════════════════════════════════════ */
  return (
    <div
      className="flex flex-col gap-3 w-full select-none items-center"
      style={{ width: MAIN_SIZE }}
    >
      {/* Main image */}
      <div className="relative group" style={{ width: MAIN_SIZE, height: MAIN_SIZE }}>
        <div
          ref={mainRef}
          className="w-full h-full border rounded-xl bg-white overflow-hidden relative cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowLens(false)}
        >
          {isVideo(rawMedia[currentIndex]) ? (
            <div className="relative w-full h-full group/video bg-black">
              <video
                ref={(el) => { if (el) videoRefs.current.set(currentIndex, el); }}
                src={rawMedia[currentIndex]}
                className="w-full h-full object-contain"
                controlsList="nodownload"
                onClick={togglePlay}
                loop
              />
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover/video:opacity-100 transition-opacity">
                <button
                  onClick={togglePlay}
                  className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} fill="white" />}
                </button>
              </div>
            </div>
          ) : (
            <img
              src={rawMedia[currentIndex]}
              className="w-full h-full object-contain"
              alt={product.name}
            />
          )}

          {/* Lens overlay */}
          {showLens && !isVideo(rawMedia[currentIndex]) && (
            <div
              className="absolute pointer-events-none rounded-md border-2 border-primary/60 bg-primary/5 shadow-inner"
              style={{
                width: LENS_SIZE,
                height: LENS_SIZE,
                left: lensPos.x,
                top: lensPos.y,
                boxShadow: "0 0 0 1px rgba(255,255,255,0.4) inset",
              }}
            />
          )}
        </div>

        {/* Zoom panel */}
        {showLens && !isVideo(rawMedia[currentIndex]) && (
          <div
            className="absolute top-0 z-[100] border bg-white shadow-2xl rounded-xl overflow-hidden pointer-events-none"
            style={{
              width: ZOOM_PANEL_SIZE,
              height: ZOOM_PANEL_SIZE,
              ...(zoomPanelSide === "right"
                ? { left: `calc(100% + 16px)` }
                : { right: `calc(100% + 16px)` }),
            }}
          >
            <div
              style={{
                width: LARGE_SIZE,
                height: LARGE_SIZE,
                transform: `translate(${zoomTranslate.x}px, ${zoomTranslate.y}px)`,
                willChange: "transform",
              }}
            >
              <img
                src={rawMedia[currentIndex]}
                className="w-full h-full object-contain"
                alt="Zoomed"
                draggable={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip — click only, no hover switching */}
      {rawMedia.length > 1 && (
        <div
          ref={thumbnailStripRef}
          className="flex gap-2 overflow-x-auto pb-1 w-full"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {rawMedia.map((media, i) => (
            <button
              key={`${media}-${i}`}
              onClick={() => setCurrentIndex(i)}
              className={`
                relative flex-shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden
                transition-all duration-200 ease-out outline-none
                ${
                  currentIndex === i
                    ? "ring-2 ring-primary ring-offset-2 opacity-100 scale-105 shadow-md"
                    : "ring-1 ring-transparent opacity-55 hover:opacity-90 hover:ring-gray-200 hover:ring-offset-1"
                }
              `}
              aria-label={`View image ${i + 1}`}
            >
              {isVideo(media) && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                    <Play className="w-3 h-3 text-white fill-current" />
                  </div>
                </div>
              )}
              <img
                src={isVideo(media) ? product.image : media}
                className="w-full h-full object-cover"
                alt={`Thumbnail ${i + 1}`}
                draggable={false}
              />
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-transform duration-200 origin-left ${
                  currentIndex === i ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedProductImageGallery;