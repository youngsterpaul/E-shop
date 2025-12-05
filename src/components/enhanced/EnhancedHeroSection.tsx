import { useState, useEffect, memo, useRef, useCallback } from 'react';
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
  return name
    .toLowerCase()
    .replace(/&/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

const generateCategoryUrl = (
  categoryName: string, 
  categoryId: number,
  categorySlug?: string | null,
  subcategoryName?: string, 
  subcategoryId?: number,
  subcategorySlug?: string | null
): string => {
  const catSlug = categorySlug || generateSlug(categoryName);
  
  if (subcategoryName && subcategoryId) {
    const subSlug = subcategorySlug || generateSlug(subcategoryName);
    return `/category/${catSlug}/${subSlug}?id=${subcategoryId}&parent=${categoryId}&source=category|${encodeURIComponent(categoryName)}|${encodeURIComponent(subcategoryName)}`;
  }
  
  return `/category/${catSlug}?id=${categoryId}&form=category&source=category|allCategory|${encodeURIComponent(categoryName)}`;
};

const CategorySidebar = memo(() => {
  const [hoveredCategory, setHoveredCategory] = useState<{ id: number; top: number; } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null); 
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const { data: categories, isLoading, error } = useCategoryHierarchy();
  const [menuTopOffset, setMenuTopOffset] = useState<number | null>(null);

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

  const handleMouseEnter = (category: any) => {
    setHoveredCategory({ id: category.id, top: 0 }); 
  };

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
    const url = generateCategoryUrl(
      category.name, 
      category.id, 
      category.slug,
      subcategory.name, 
      subcategory.id,
      subcategory.slug
    );
    navigate(url);
  };

  if (isMobile) return null;

  if (isLoading) {
    return (
      <div className="absolute left-0 top-0 w-[260px] h-[480px] bg-card/95 backdrop-blur-sm shadow-xl z-40 rounded-xl overflow-hidden border border-border/50">
        <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <div className="flex items-center gap-2">
            <Grid3X3 size={18} />
            <span className="font-semibold text-sm tracking-wide">ALL CATEGORIES</span>
          </div>
        </div>
        <div className="p-3 space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-10 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !categories || categories.length === 0) {
    return (
      <div className="absolute left-0 top-0 w-[260px] h-[480px] bg-card/95 backdrop-blur-sm shadow-xl z-40 rounded-xl overflow-hidden border border-border/50">
        <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <div className="flex items-center gap-2">
            <Grid3X3 size={18} />
            <span className="font-semibold text-sm tracking-wide">ALL CATEGORIES</span>
          </div>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          {error ? 'Unable to load categories' : 'No categories available'}
        </div>
      </div>
    );
  }
  
  const HEADER_HEIGHT = 56;
  const FOOTER_HEIGHT = 0;
  const MEGA_MENU_HEIGHT = 480;
  const SCROLLABLE_CONTENT_MAX_HEIGHT = MEGA_MENU_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;

  return (
    <div 
      ref={sidebarRef} 
      className="absolute left-0 top-0 w-[260px] h-[480px] bg-card/98 backdrop-blur-md shadow-2xl z-40 rounded-xl overflow-hidden border border-border/30"
    >
      <div className="p-4 bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground">
        <div className="flex items-center gap-2.5">
          <Grid3X3 size={18} className="opacity-90" />
          <span className="font-semibold text-sm tracking-wide">ALL CATEGORIES</span>
        </div>
      </div>
      
      <div className="relative h-[calc(100%-56px)] overflow-y-auto scrollbar-subtle">
        {categories.map((category, index) => {
          const IconComponent = category.icon || ShoppingBag;
          return (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => handleMouseEnter(category)} 
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div
                onClick={(e) => handleCategoryClick(category, e)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 text-sm transition-all duration-200 cursor-pointer group",
                  "text-foreground/80 hover:text-primary hover:bg-primary/5",
                  index !== categories.length - 1 && "border-b border-border/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    <IconComponent size={18} />
                  </span>
                  <span className="font-medium truncate">{category.name}</span>
                </div>
                {category.subcategories.length > 0 && (
                  <ChevronRight size={14} className="text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                )}
              </div>

              {hoveredCategory?.id === category.id && category.subcategories.length > 0 && menuTopOffset !== null && (
                <div 
                  className="fixed ml-[260px] w-[900px] bg-card/98 backdrop-blur-md shadow-2xl border border-border/30 z-[60] overflow-hidden h-[480px] rounded-xl"
                  style={{ top: `${menuTopOffset}px` }}
                >
                  <div className="sticky top-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/30 px-5 py-4 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconComponent size={16} className="text-primary" />
                      </div>
                      <span className="text-base font-bold text-foreground tracking-wide">
                        {category.name}
                      </span>
                    </div>
                  </div>
                  
                  <div 
                    className="overflow-y-auto overflow-x-hidden p-5 scrollbar-subtle" 
                    style={{ maxHeight: `${SCROLLABLE_CONTENT_MAX_HEIGHT}px` }} 
                  >
                    <div className="grid grid-cols-6 gap-4">
                      {category.subcategories.map((subcategory: any) => {
                        const SubIcon = ShoppingBag;
                        return (
                          <div
                            key={subcategory.id}
                            onClick={(e) => handleSubcategoryClick(category, subcategory, e)}
                            className="flex flex-col items-center p-3 rounded-xl hover:bg-primary/5 hover:shadow-lg transition-all duration-300 cursor-pointer group border border-transparent hover:border-primary/20"
                          >
                            <div className="relative w-16 h-16 mb-2 rounded-xl overflow-hidden bg-muted/50 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                              {subcategory.productImage ? (
                                <>
                                  <OptimizedImage
                                    src={subcategory.productImage}
                                    alt={subcategory.name}
                                    className="w-full h-full object-cover"
                                    priority={false}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </>
                              ) : (
                                <div className={cn(
                                  "w-full h-full flex items-center justify-center",
                                  subcategory.color || 'bg-gradient-to-br from-muted to-muted/80'
                                )}>
                                  <SubIcon size={20} className="text-muted-foreground/60" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-foreground/70 text-center leading-tight font-medium group-hover:text-primary transition-colors line-clamp-2 px-1">
                              {subcategory.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="sticky bottom-0 bg-gradient-to-r from-muted/50 to-card border-t border-border/30 px-5 py-3">
                    <div
                      onClick={(e) => handleCategoryClick(category, e)}
                      className="text-sm text-primary hover:text-primary/80 font-semibold cursor-pointer text-center py-1.5 hover:underline transition-all flex items-center justify-center gap-2"
                    >
                      View All {category.name}
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

CategorySidebar.displayName = 'CategorySidebar';

const EnhancedHeroSection = memo(() => {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  useEffect(() => {
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
      } catch (error) {
        console.error('Error fetching hero slides:', error);
        setLoading(false);
      }
    };

    fetchHeroSlides();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || heroSlides.length <= 1) return;
    
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, heroSlides.length]);

  const goToSlide = useCallback((index: number) => {
    if (index === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 300);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % heroSlides.length);
  }, [currentSlide, heroSlides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
  }, [currentSlide, heroSlides.length, goToSlide]);

  const handleSlideClick = () => {
    const currentSlideData = heroSlides[currentSlide];
    if (currentSlideData?.link) {
      if (currentSlideData.link.startsWith('http')) {
        window.open(currentSlideData.link, '_blank');
      } else {
        navigate(currentSlideData.link);
      }
    }
  };

  if (loading) {
    return (
      <section className={cn(
        "relative bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse",
        isMobile ? "h-[140px] mx-2 my-2 rounded-xl overflow-hidden" : "h-[480px]"
      )}>
        {!isMobile && <CategorySidebar />}
      </section>
    );
  }

  if (heroSlides.length === 0) {
    return (
      <section className={cn(
        "relative bg-gradient-to-br from-background via-muted to-background",
        isMobile ? "h-[140px] mx-2 my-2 rounded-xl overflow-hidden" : "h-[480px]"
      )}>
        {!isMobile && <CategorySidebar />}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          !isMobile && "ml-[260px]"
        )}>
          <p className="text-muted-foreground text-lg">No banner images available</p>
        </div>
      </section>
    );
  }

  const currentSlideData = heroSlides[currentSlide] ?? heroSlides[0];

  return (
    <section className={cn(
      "relative overflow-hidden",
      isMobile ? "h-[140px] mx-2 my-2 rounded-xl" : "h-[480px]"
    )}>
      {!isMobile && <CategorySidebar />}
      
      {/* Hero Carousel */}
      <div 
        className={cn(
          "absolute inset-0 cursor-pointer",
          !isMobile && "ml-[260px] rounded-r-xl overflow-hidden"
        )}
        onClick={handleSlideClick}
      >
        {/* Slide Image */}
        <div className={cn(
          "relative w-full h-full transition-opacity duration-500",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}>
          <LazyImage
            src={currentSlideData.image_url}
            alt={currentSlideData.title}
            priority
            width={1920}
            height={1080}
            className="object-cover w-full h-full"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
        </div>

        {/* Navigation Arrows - Desktop Only */}
        {!isMobile && heroSlides.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-foreground hover:bg-background hover:scale-110 transition-all duration-300 z-20 border border-border/50"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-foreground hover:bg-background hover:scale-110 transition-all duration-300 z-20 border border-border/50"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Slide Indicators */}
      {heroSlides.length > 1 && (
        <div className={cn(
          "absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20",
          !isMobile ? "bottom-6" : "bottom-3"
        )}>
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={cn(
                "rounded-full transition-all duration-300 shadow-sm",
                index === currentSlide 
                  ? "w-8 h-2.5 bg-primary" 
                  : "w-2.5 h-2.5 bg-background/70 hover:bg-background/90 hover:scale-110"
              )}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter - Desktop */}
      {!isMobile && heroSlides.length > 1 && (
        <div className="absolute bottom-6 right-6 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium text-foreground z-20 border border-border/50">
          {currentSlide + 1} / {heroSlides.length}
        </div>
      )}
    </section>
  );
});

EnhancedHeroSection.displayName = 'EnhancedHeroSection';

export default EnhancedHeroSection;
