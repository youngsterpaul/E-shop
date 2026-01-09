import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Play, Pause } from "lucide-react";
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
  const [backgroundPos, setBackgroundPos] = useState({ x: 0, y: 0 }); // MouseX/Y relative to main image (0 to 400)
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0); // Real-time drag offset in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const isMobile = isMobileUserAgent();
  const minSwipe = 50;

  // Zoom configuration
  const lensSize = 220;
  const zoomLevel = 2.5; // Magnification factor
  const mainImageSize = 400; // Fixed size of the main image container

  /** Check if URL is a video file */
  const isVideo = useCallback((url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) || url === product.video;
  }, [product.video]);

  /** Combine product media - videos first */
  const allMedia = useMemo(() => {
    const imgs = [product.image];
    
    product.images?.forEach(img => {
      if (img !== product.image && !imgs.includes(img)) {
        imgs.push(img);
      }
    });
    
    if (variantImages.length > 0) {
      variantImages.forEach(variant => {
        if (variant.url && !imgs.includes(variant.url)) {
          imgs.push(variant.url);
        }
      });
    }
    
    const finalMedia = product.video && !imgs.includes(product.video) ? [...imgs, product.video] : imgs;
    
    // Sort: videos first, then images
    return finalMedia.sort((a, b) => {
      const aIsVideo = isVideo(a);
      const bIsVideo = isVideo(b);
      if (aIsVideo && !bIsVideo) return -1;
      if (!aIsVideo && bIsVideo) return 1;
      return 0;
    });
  }, [product.image, product.images, product.video, variantImages, isVideo]);

  // If a selected image is provided (e.g., from color variant), switch to it
  useEffect(() => {
    if (!selectedImageUrl) return;
    const idx = allMedia.findIndex((m) => m === selectedImageUrl);
    if (idx >= 0) {
      setCurrentIndex(idx);
      setTimeout(() => {
        thumbsRef.current?.children[idx]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }, 100);
    }
  }, [selectedImageUrl, allMedia]);

  /** Change image */
  const changeImage = useCallback(
    (idx: number) => {
      if (idx === currentIndex) return;
      setCurrentIndex(idx);
      setTimeout(() => {
        thumbsRef.current?.children[idx]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }, 50);
    },
    [currentIndex]
  );

  const next = useCallback(() => changeImage((currentIndex + 1) % allMedia.length), [currentIndex, allMedia.length, changeImage]);
  const prev = useCallback(() => changeImage((currentIndex - 1 + allMedia.length) % allMedia.length), [currentIndex, allMedia.length, changeImage]);

  /** Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  /** Touch swipe (mobile) - Kilimall style with real-time drag */
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || !mainRef.current) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStartX;
    setDragOffset(diff);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const dist = touchStartX - e.changedTouches[0].clientX;
    
    setIsDragging(false);
    setDragOffset(0);
    
    if (dist > minSwipe) {
      // Stop video if playing before swiping
      if (videoRef.current && isVideoPlaying) {
        videoRef.current.pause();
      }
      next();
    } else if (dist < -minSwipe) {
      // Stop video if playing before swiping
      if (videoRef.current && isVideoPlaying) {
        videoRef.current.pause();
      }
      prev();
    }
    
    setTouchStartX(null);
  };

  // Autoplay video on scroll (mobile) using Intersection Observer
  useEffect(() => {
    if (!isMobile || !videoContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.current) {
            videoRef.current.play().catch(() => {
              // Autoplay failed, show play button
              setShowPlayButton(true);
            });
          } else if (!entry.isIntersecting && videoRef.current) {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoContainerRef.current);
    return () => observer.disconnect();
  }, [isMobile, currentIndex, allMedia]);

  /** Kilimall-style Magnifier (desktop) */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainRef.current || isVideo(allMedia[currentIndex])) return;
    const { left, top, width, height } = mainRef.current.getBoundingClientRect();

    // Mouse position relative to image container (0 to 400)
    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;

    // Check bounds
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
      setShowLens(false);
      return;
    }

    // Lens position (centered on cursor, bounded within image)
    const lensX = Math.max(0, Math.min(mouseX - lensSize / 2, width - lensSize));
    const lensY = Math.max(0, Math.min(mouseY - lensSize / 2, height - lensSize));

    requestAnimationFrame(() => {
      setLensPos({ x: lensX, y: lensY });
      // Store mouse position for translation calculation in the magnified panel
      setBackgroundPos({ x: mouseX, y: mouseY });
      setShowLens(true);
    });
  };

  const handleMouseLeave = () => setShowLens(false);

  /* =================== MOBILE VIEW =================== */
  if (isMobile) {
    // Calculate the container width for drag offset percentage
    const containerWidth = mainRef.current?.offsetWidth || 1;
    const dragPercentage = (dragOffset / containerWidth) * (100 / allMedia.length);
    
    return (
      <div className="space-y-3 w-full">
        <div
          ref={mainRef}
          className="relative aspect-square w-full bg-white overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`flex h-full items-start ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
            style={{
              width: `${allMedia.length * 100}%`,
              transform: `translateX(calc(-${currentIndex * (100 / allMedia.length)}% + ${dragOffset}px))`
            }}
          >
            {allMedia.map((media, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 flex items-start relative"
                style={{ width: `${100 / allMedia.length}%` }} 
              >
                {isVideo(media) ? (
                  <div 
                    ref={i === currentIndex ? videoContainerRef : null}
                    className="relative w-full h-full"
                  >
                    <video
                      ref={i === currentIndex ? videoRef : null}
                      src={media}
                      className="w-full h-full object-cover object-top"
                      poster={product.image}
                      preload="metadata"
                      playsInline
                      loop
                      onPlay={() => {
                        setIsVideoPlaying(true);
                        setShowPlayButton(false);
                      }}
                      onPause={() => {
                        setIsVideoPlaying(false);
                        setShowPlayButton(true);
                      }}
                      onEnded={() => {
                        setIsVideoPlaying(false);
                        setShowPlayButton(true);
                        setVideoProgress(0);
                      }}
                      onTimeUpdate={(e) => {
                        const video = e.currentTarget;
                        if (video.duration) {
                          setVideoProgress((video.currentTime / video.duration) * 100);
                        }
                      }}
                    />
                    {/* Video progress bar */}
                    {isVideoPlaying && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                        <div 
                          className="h-full bg-primary transition-all duration-100 ease-linear"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>
                    )}
                    {/* Play/Pause button overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current) {
                          if (isVideoPlaying) {
                            videoRef.current.pause();
                          } else {
                            videoRef.current.play();
                          }
                        }
                      }}
                      className="absolute inset-0 flex items-center justify-center transition-opacity"
                      aria-label={isVideoPlaying ? "Pause video" : "Play video"}
                    >
                      <div className={`w-14 h-14 rounded-full bg-black/50 flex items-center justify-center transition-opacity duration-200 ${isVideoPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                        {isVideoPlaying ? (
                          <Pause className="w-7 h-7 text-white" />
                        ) : (
                          <Play className="w-7 h-7 text-white ml-0.5" />
                        )}
                      </div>
                    </button>
                  </div>
                ) : (
                  <OptimizedImage
                    src={media}
                    alt={product.name}
                    width={800}
                    height={800}
                    className="w-full h-full object-cover object-top"
                    priority={i === currentIndex}
                  />
                )}
              </div>
            ))}
          </div>
          
          {allMedia.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2 p-2 z-10">
              {allMedia.map((_, i) => (
                <button
                  key={i}
                  onClick={() => changeImage(i)}
                  className={`h-2 rounded-full transition-colors duration-300 flex-shrink-0 ${
                      i === currentIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70 w-2'
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-6 items-start w-full max-w-5xl mx-auto p-4 bg-white shadow-lg">
      {/* 1. Thumbnails on the left */}
      {allMedia.length > 1 && (
        <div
          ref={thumbsRef}
          className="flex flex-col gap-2 overflow-y-auto max-h-[500px] scrollbar-hide flex-shrink-0"
        >
          {allMedia.map((media, i) => (
            <button
              key={i}
              onClick={() => changeImage(i)}
              className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  currentIndex === i
                    ? "border-green-500 ring-2 ring-green-200 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              aria-label={`View image ${i + 1}`}
            >
              {isVideo(media) ? (
                <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                  <OptimizedImage
                    src={product.image}
                    alt="Video thumbnail"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                  {/* Play icon overlay centered on thumbnail */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <OptimizedImage
                  src={media}
                  alt={`thumb-${i}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 2. Main Image Container */}
      <div className="relative flex justify-center items-start flex-grow">
        {/* Main Image Wrapper (Fixed Size) */}
        <div
          ref={mainRef}
          className="relative bg-white overflow-hidden rounded-lg shadow-xl cursor-crosshair w-[400px] h-[400px]"
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
              width={800}
              height={800}
              className="w-full h-full object-contain"
              priority={currentIndex === 0}
            />
          )}
          
          {/* Lens Overlay (follows cursor) */}
          {showLens && !isVideo(allMedia[currentIndex]) && (
            <div
              className="absolute border-2 border-gray-900 bg-black/50 rounded-lg shadow-2xl pointer-events-none transition-opacity duration-100"
              style={{
                width: lensSize,
                height: lensSize,
                transform: `translate(${lensPos.x}px, ${lensPos.y}px)`,
                opacity: showLens ? 1 : 0,
              }}
            />
          )}
        </div> 

        {/* 3. Magnified View Panel - FIX APPLIED HERE */}
        {showLens && !isVideo(allMedia[currentIndex]) && (
          <div
            className="absolute left-full top-0 ml-6 w-[400px] h-[400px] bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200"
          >
            {/* Inner wrapper for the zoom transform */}
            <div
              className="relative transition-transform duration-50 ease-out"
              style={{
                // Set the size of the container to the MAGNIFIED size
                width: `${mainImageSize * zoomLevel}px`,
                height: `${mainImageSize * zoomLevel}px`,
                // Translate the magnified image container to center the focused area
                transform: `translate(
                    ${mainImageSize / 2 - backgroundPos.x * zoomLevel}px,
                    ${mainImageSize / 2 - backgroundPos.y * zoomLevel}px
                )`,
              }}
            >
              {/* 🛑 CHANGE: Switched to standard <img> tag */}
              <img
                src={allMedia[currentIndex]}
                alt={product.name + " - Magnified"}
                // Important: Use full width/height and object-cover
                className="w-full h-full absolute top-0 left-0"
                style={{
                  objectFit: 'cover' 
                }}
              />
            </div>
          </div>
        )}
      </div> {/* End of Main Image Container Group */}
    </div> /* End of desktop container */
  );
}

export default EnhancedProductImageGallery;