import { useState, useEffect, memo, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ShoppingBag, Grid3X3 } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import OptimizedImage from '@/components/OptimizedImage';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';
import { cn } from '@/lib/utils';
interface HeroSlide {
  id: string;
  title: string;
  image_url: string;
  link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
const generateSlug = (name: string): string => {
  return name.toLowerCase().replace(/&/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};
const generateCategoryUrl = (categoryName: string, categoryId: number, categorySlug?: string | null, subcategoryName?: string, subcategoryId?: number, subcategorySlug?: string | null): string => {
  const catSlug = categorySlug || generateSlug(categoryName);
  if (subcategoryName && subcategoryId) {
    const subSlug = subcategorySlug || generateSlug(subcategoryName);
    return `/category/${catSlug}/${subSlug}?id=${subcategoryId}&parent=${categoryId}&source=category|${encodeURIComponent(categoryName)}|${encodeURIComponent(subcategoryName)}`;
  }
  return `/category/${catSlug}?id=${categoryId}&form=category&source=category|allCategory|${encodeURIComponent(categoryName)}`;
};
const CategorySidebar = memo(() => {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const {
    data: categories,
    isLoading,
    error
  } = useCategoryHierarchy();
  const [menuTopOffset, setMenuTopOffset] = useState<number>(0);
  useEffect(() => {
    const calculateOffset = () => {
      if (sidebarRef.current) {
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        setMenuTopOffset(sidebarRect.top);
      }
    };
    calculateOffset();
    window.addEventListener('scroll', calculateOffset);
    window.addEventListener('resize', calculateOffset);
    return () => {
      window.removeEventListener('scroll', calculateOffset);
      window.removeEventListener('resize', calculateOffset);
    };
  }, [categories]);
  const handleCategoryClick = (category: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = generateCategoryUrl(category.name, category.id, category.slug);
    navigate(url);
  };
  const handleSubcategoryClick = (category: any, subcategory: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = generateCategoryUrl(category.name, category.id, category.slug, subcategory.name, subcategory.id, subcategory.slug);
    navigate(url);
  };
  if (isMobile) return null;
  if (isLoading) {
    return <div className="absolute left-0 top-0 bottom-0 w-[260px] bg-card shadow-2xl z-40 rounded-l-xl border border-border/30 flex flex-col">
        <div className="p-4 bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground rounded-tl-xl">
          <div className="flex items-center gap-2.5">
            <Grid3X3 size={18} className="opacity-90" />
            <span className="font-semibold text-sm tracking-wide">ALL CATEGORIES</span>
          </div>
        </div>
        <div className="flex-1 p-1">
          {[...Array(9)].map((_, i) => <div key={i} className="h-10 mx-2 my-1 bg-muted/40 animate-pulse rounded-lg" />)}
        </div>
      </div>;
  }
  if (error || !categories || categories.length === 0) {
    return <div className="absolute left-0 top-0 bottom-0 w-[260px] bg-card shadow-2xl z-40 rounded-l-xl border border-border/30 flex flex-col">
        <div className="p-4 bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground rounded-tl-xl">
          <div className="flex items-center gap-2.5">
            <Grid3X3 size={18} className="opacity-90" />
            <span className="font-semibold text-sm tracking-wide">ALL CATEGORIES</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          {error ? 'Unable to load categories' : 'No categories available'}
        </div>
      </div>;
  }
  const hoveredCategoryData = categories.find(c => c.id === hoveredCategory);
  return <div ref={sidebarRef} className="absolute left-0 top-0 bottom-0 w-[260px] bg-card shadow-2xl z-40 rounded-l-xl border border-border/30 flex flex-col">
      <div className="p-4 bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground rounded-tl-xl">
        <div className="flex items-center gap-2.5">
          <Grid3X3 size={18} className="opacity-90" />
          <span className="font-semibold text-sm tracking-wide">ALL CATEGORIES</span>
        </div>
      </div>
      
      <div className="flex-1">
        {categories.map((category, index) => {
        const IconComponent = category.icon || ShoppingBag;
        return <div key={category.id} className="relative" onMouseEnter={() => setHoveredCategory(category.id)} onMouseLeave={() => setHoveredCategory(null)}>
              <div onClick={e => handleCategoryClick(category, e)} className={cn("flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-200 cursor-pointer group", "text-foreground/80 hover:text-primary hover:bg-primary/5", hoveredCategory === category.id && "text-primary bg-primary/5", index !== categories.length - 1 && "border-b border-border/30")}>
                <div className="flex items-center gap-3">
                  <span className={cn("text-muted-foreground group-hover:text-primary transition-colors", hoveredCategory === category.id && "text-primary")}>
                    <IconComponent size={18} />
                  </span>
                  <span className="font-medium">{category.name}</span>
                </div>
                {category.subcategories.length > 0 && <ChevronRight size={14} className={cn("text-muted-foreground/60 group-hover:text-primary transition-all", hoveredCategory === category.id && "text-primary translate-x-0.5")} />}
              </div>
            </div>;
      })}
      </div>

      {/* Mega Menu - Matches hero section width with min-width to prevent compression */}
      {hoveredCategoryData && hoveredCategoryData.subcategories.length > 0 && <div className="absolute left-full top-0 bottom-0 min-w-[1100px] bg-card shadow-2xl border border-border/30 z-[100] rounded-r-xl flex flex-col" onMouseEnter={() => setHoveredCategory(hoveredCategoryData.id)} onMouseLeave={() => setHoveredCategory(null)}>
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/30 px-5 py-3 rounded-tr-xl">
            <div className="flex items-center /justify-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                {hoveredCategoryData.icon && <hoveredCategoryData.icon size={16} className="text-primary" />}
              </div>
              <span className="text-base font-bold text-foreground tracking-wide">
                {hoveredCategoryData.name}
              </span>
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-3">
              {hoveredCategoryData.subcategories.map(subcategory => {
            const SubIcon = ShoppingBag;
            return <div key={subcategory.id} onClick={e => handleSubcategoryClick(hoveredCategoryData, subcategory, e)} className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-primary/5 hover:shadow-lg transition-all duration-300 cursor-pointer group border border-transparent hover:border-primary/20">
                    <div className="relative w-14 h-14 mb-1.5 rounded-xl overflow-hidden bg-muted/50 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                      {subcategory.productImage ? <>
                          <OptimizedImage src={subcategory.productImage} alt={subcategory.name} className="w-full h-full object-cover" priority={false} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </> : <div className={cn("w-full h-full flex items-center justify-center", subcategory.color || 'bg-gradient-to-br from-muted to-muted/80')}>
                          <SubIcon size={18} className="text-muted-foreground/60" />
                        </div>}
                    </div>
                    <span className="text-xs text-foreground/70 text-center leading-tight font-medium group-hover:text-primary transition-colors line-clamp-2 px-1 w-full">
                      {subcategory.name}
                    </span>
                  </div>;
          })}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-muted/50 to-card border-t border-border/30 px-5 py-2.5 rounded-br-xl">
            <div onClick={e => handleCategoryClick(hoveredCategoryData, e)} className="text-sm text-primary hover:text-primary/80 font-semibold cursor-pointer text-center py-1 hover:underline transition-all flex items-center justify-center gap-2">
              View All {hoveredCategoryData.name}
              <ChevronRight size={16} />
            </div>
          </div>
        </div>}
    </div>;
});
CategorySidebar.displayName = 'CategorySidebar';
const EnhancedHeroSection = memo(() => {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  // ── Mobile swipe state ──
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const swipeStartTime = useRef<number>(0);

  // Cloned slide array for infinite loop: [last, ...slides, first]
  const mobileSlides = useMemo(() => {
    if (heroSlides.length <= 1) return heroSlides;
    return [heroSlides[heroSlides.length - 1], ...heroSlides, heroSlides[0]];
  }, [heroSlides]);

  // mobileIndex starts at 1 (first real slide, after the leading clone)
  const [mobileIndex, setMobileIndex] = useState(1);

  useEffect(() => { setMobileIndex(1); }, [heroSlides.length]);

  // Infinite-loop: silently jump from clone back to real slide after transition
  useEffect(() => {
    if (!isMobile || isDragging || heroSlides.length <= 1) return;
    if (mobileIndex === 0) {
      const t = setTimeout(() => { setIsTransitioning(false); setMobileIndex(mobileSlides.length - 2); }, 300);
      return () => clearTimeout(t);
    }
    if (mobileIndex === mobileSlides.length - 1) {
      const t = setTimeout(() => { setIsTransitioning(false); setMobileIndex(1); }, 300);
      return () => clearTimeout(t);
    }
  }, [mobileIndex, isMobile, isDragging, mobileSlides.length, heroSlides.length]);

  // Mobile auto-play: advances mobileIndex on the same 5s interval
  useEffect(() => {
    if (!isMobile || !isAutoPlaying || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setMobileIndex(prev => prev + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [isMobile, isAutoPlaying, heroSlides.length]);

  useEffect(() => {
    const CACHE_KEY = 'heroSlides';
    const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

    // Try to read cached slides
    const cachedDataRaw = localStorage.getItem(CACHE_KEY);
    if (cachedDataRaw) {
      try {
        const cachedData = JSON.parse(cachedDataRaw);
        // Check if cache is still valid
        if (cachedData?.slides && Date.now() - cachedData.timestamp < CACHE_TTL) {
          setHeroSlides(cachedData.slides);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error parsing cached hero slides:', err);
      }
    }

    // Fetch fresh slides from Supabase
    const fetchHeroSlides = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (error) throw error;
        setHeroSlides(data || []);
        setLoading(false);
        // Save to cache with timestamp
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ slides: data, timestamp: Date.now() })
        );
      } catch (err) {
        console.error('Error fetching hero slides:', err);
        setLoading(false);
      }
    };

    fetchHeroSlides();
  }, []);

  useEffect(() => {
    if (isMobile || !isAutoPlaying || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, heroSlides.length, isMobile]);

  const goToSlide = useCallback((index: number) => {
    if (index === currentSlide) return;
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [currentSlide]);
  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [heroSlides.length]);
  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [heroSlides.length]);

  const handleSlideClick = () => {
    if (Math.abs(dragOffset) > 5) return; // ignore swipe-release taps
    const currentSlideData = heroSlides[currentSlide];
    if (currentSlideData?.link) {
      if (currentSlideData.link.startsWith('http')) {
        window.open(currentSlideData.link, '_blank');
      } else {
        navigate(currentSlideData.link);
      }
    }
  };

  // ── Mobile touch handlers ──
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    swipeStartTime.current = Date.now();
    setIsDragging(true);
    setIsTransitioning(false);
    setIsAutoPlaying(false); // pause auto-play while dragging
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setDragOffset(e.targetTouches[0].clientX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    const duration = Date.now() - swipeStartTime.current;
    const velocity = Math.abs(dragOffset) / duration;
    setIsDragging(false);
    setIsTransitioning(true);

    if (Math.abs(dragOffset) > 50 || velocity > 0.5) {
      setMobileIndex(prev => dragOffset < 0 ? prev + 1 : prev - 1);
      if (window.navigator.vibrate) window.navigator.vibrate(5);
    }
    setDragOffset(0);
    setTouchStartX(null);
    setTimeout(() => setIsAutoPlaying(true), 10000); // resume auto-play after 10s
  };

  // Active dot index accounting for clones
  const activeDotIndex = useMemo(() => {
    if (mobileIndex === 0) return heroSlides.length - 1;
    if (mobileIndex === mobileSlides.length - 1) return 0;
    return mobileIndex - 1;
  }, [mobileIndex, mobileSlides.length, heroSlides.length]);

  /*
   * Hero Image Guidelines:
   * -----------------------
   * Desktop: Recommended size 1920x480px (4:1 aspect ratio)
   * Mobile: Recommended size 750x280px (2.68:1 aspect ratio)
   * 
   * For best results:
   * - Keep important content centered (safe zone: middle 60% of image)
   * - Use high-quality images (min 72 DPI, prefer 150 DPI)
   * - Avoid text in images when possible (use overlay text instead)
   * - File format: WebP preferred, JPEG fallback (max 200KB)
   */

  if (loading) {
    return (
      <section 
        className={cn("relative bg-gradient-to-br from-muted via-muted/80 to-muted", isMobile ? "aspect-[2.68/1] mx-2 my-2 rounded-xl overflow-hidden" : "aspect-[2.8/1] max-h-[520px]")}
        aria-label="Loading hero section"
        role="region"
      >
        {!isMobile && <CategorySidebar />}
        <div className="absolute inset-0 skeleton-loading" aria-hidden="true" />
      </section>
    );
  }
  if (heroSlides.length === 0) {
    return (
      <section 
        className={cn("relative bg-gradient-to-br from-background via-muted to-background", isMobile ? "aspect-[2.68/1] mx-2 my-2 rounded-xl overflow-hidden" : "aspect-[2.8/1] max-h-[520px]")}
        aria-label="Hero section"
        role="region"
      >
        {!isMobile && <CategorySidebar />}
        <div className={cn("absolute inset-0 flex items-center justify-center", !isMobile && "ml-[260px]")}>
          <p className="text-muted-foreground text-lg">No banner images available</p>
        </div>
      </section>
    );
  }

  /* ══════════════════════ MOBILE RENDER ══════════════════════ */
  if (isMobile) {
    return (
      <section
        className="relative aspect-[2.68/1] mx-2 my-2 rounded-xl overflow-hidden"
        aria-label="Featured promotions"
        role="region"
      >
        <div
          className="relative w-full h-full touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleSlideClick}
        >
          {/* Sliding strip with live drag offset */}
          <div
            className={cn("flex h-full w-full", isTransitioning && "transition-transform duration-300 ease-out")}
            style={{ transform: `translateX(calc(-${mobileIndex * 100}% + ${dragOffset}px))` }}
          >
            {mobileSlides.map((slide, i) => (
              <div key={`${slide.id}-${i}`} className="w-full h-full flex-shrink-0 relative">
                <LazyImage
                  src={slide.image_url}
                  alt={slide.title || `Promotional banner ${i}`}
                  priority={i === 1}
                  width={750}
                  height={280}
                  aspectRatio="fill"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" aria-hidden="true" />
              </div>
            ))}
          </div>

          {/* Original dot style — no background pill */}
          {heroSlides.length > 1 && (
            <div
              className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20"
              role="tablist"
              aria-label="Slide navigation"
            >
              {heroSlides.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-500 shadow-sm",
                    i === activeDotIndex
                      ? "w-0.5 h-0.5 bg-primary"
                      : "w-0.5 h-0.5 bg-background/70"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section 
      className={cn("relative overflow-hidden", isMobile ? "aspect-[2.68/1] mx-2 my-2 rounded-xl" : "aspect-[2.8/1] max-h-[520px]")}
      aria-label="Featured promotions"
      role="region"
    >
      {!isMobile && <CategorySidebar />}
      
      {/* Hero Carousel with Slide Animation */}
      <div 
        className={cn("absolute inset-0 cursor-pointer group", !isMobile && "ml-[260px] rounded-r-xl overflow-hidden")} 
        onClick={handleSlideClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSlideClick(); }}
        aria-label={heroSlides[currentSlide]?.title || 'View promotion'}
      >
        {/* Slides Container */}
        <div className="relative w-full h-full">
          {heroSlides.map((slide, index) => (
            <div 
              key={slide.id} 
              className={cn("absolute inset-0 transition-all duration-700 ease-out", index === currentSlide ? "opacity-100 translate-x-0" : index < currentSlide ? "opacity-0 -translate-x-full" : "opacity-0 translate-x-full")}
              aria-hidden={index !== currentSlide}
            >
              <div className="w-full h-full overflow-hidden relative">
                <LazyImage 
                  src={slide.image_url} 
                  alt={slide.title || `Promotional banner ${index + 1}`} 
                  priority={index === 0} 
                  width={1920} 
                  height={480}
                  aspectRatio="fill"
                  className={cn("object-cover w-full h-full transition-transform duration-[5000ms] ease-out", index === currentSlide ? "scale-110" : "scale-100")} 
                />
              </div>
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" aria-hidden="true" />
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Desktop Only */}
        {!isMobile && heroSlides.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prevSlide(); }} 
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/90 shadow-lg flex items-center justify-center text-foreground hover:bg-background hover:scale-110 transition-all duration-300 z-20 border border-border/50 min-w-[44px] min-h-[44px] opacity-0 group-hover:opacity-100" 
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextSlide(); }} 
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/90 shadow-lg flex items-center justify-center text-foreground hover:bg-background hover:scale-110 transition-all duration-300 z-20 border border-border/50 min-w-[44px] min-h-[44px] opacity-0 group-hover:opacity-100" 
              aria-label="Next slide"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Slide Indicators */}
      {heroSlides.length > 1 && (
        <div 
          className={cn("absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20", !isMobile ? "bottom-6 ml-28" : "bottom-3")}
          role="tablist"
          aria-label="Slide navigation"
        >
          {heroSlides.map((slide, index) => (
            <button 
              key={index} 
              type="button"
              role="tab"
              aria-selected={index === currentSlide}
              aria-label={`Go to slide ${index + 1}: ${slide.title || `Promotion ${index + 1}`}`}
              className={cn("rounded-full transition-all duration-500 shadow-sm min-w-[8px] min-h-[8px] flex items-center justify-center", index === currentSlide ? "w-0.5 h-0.5 bg-primary" : "w-0.5 h-0.5 bg-background/70 hover:bg-background/90 hover:scale-110")} 
              onClick={(e) => { e.stopPropagation(); goToSlide(index); }} 
            />
          ))}
        </div>
      )}

    </section>
  );
});
EnhancedHeroSection.displayName = 'EnhancedHeroSection';
export default EnhancedHeroSection;