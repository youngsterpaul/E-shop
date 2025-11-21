import { useState, useEffect, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import OptimizedImage from '@/components/OptimizedImage';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';

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

// Helper function to generate slug from category name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/&/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

// Helper function to generate category URL
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

  // State to store the calculated fixed top position for the mega menu
  // This will now align with the top of the entire sidebar container.
  const [menuTopOffset, setMenuTopOffset] = useState<number | null>(null);

  // Effect to calculate and update the fixed top position on mount/resize/scroll
  useEffect(() => {
    const calculateOffset = () => {
        if (sidebarRef.current) {
          // Get the viewport position of the whole sidebar
          const sidebarRect = sidebarRef.current.getBoundingClientRect();
          
          // Target position is the absolute top of the viewport where the sidebar begins.
          // This aligns the mega menu perfectly with the top edge of the hero banner.
          const targetTop = sidebarRect.top; 
          setMenuTopOffset(targetTop);
        }
    };

    // Calculate once on mount
    calculateOffset();
    
    // Recalculate on scroll and resize events for perfect fixed alignment
    // This is crucial because the sidebar is absolute and scrolls with the page, 
    // but the mega menu is fixed and must track the sidebar's position.
    window.addEventListener('scroll', calculateOffset);
    window.addEventListener('resize', calculateOffset);

    // Cleanup listeners
    return () => {
        window.removeEventListener('scroll', calculateOffset);
        window.removeEventListener('resize', calculateOffset);
    };
  }, [categories]); 

  const handleMouseEnter = (category: any) => {
    // Only set the hover ID; the menu position is derived from menuTopOffset
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

  // Don't show sidebar on mobile
  if (isMobile) return null;

  // Show loading state
  if (isLoading) {
    // The sidebar should explicitly use the hero section height (500px) on desktop
    return (
      <div className="absolute left-0 top-0 w-64 h-[500px] bg-white shadow-lg z-40 border-r overflow-hidden">
        <div className="p-3 bg-green-500 text-white font-semibold text-sm">
          ALL CATEGORIES
        </div>
        <div className="p-4 space-y-2">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.error('Category hierarchy error:', error);
    // The sidebar should explicitly use the hero section height (500px) on desktop
    return (
      <div className="absolute left-0 top-0 w-64 h-[500px] bg-white shadow-lg z-40 border-r overflow-hidden">
        <div className="p-3 bg-green-500 text-white font-semibold text-sm">
          ALL CATEGORIES
        </div>
        <div className="p-4 text-sm text-gray-500">
          Unable to load categories
        </div>
      </div>
    );
  }

  // No categories available
  if (!categories || categories.length === 0) {
    // The sidebar should explicitly use the hero section height (500px) on desktop
    return (
      <div className="absolute left-0 top-0 w-64 h-[500px] bg-white shadow-lg z-40 border-r overflow-hidden">
        <div className="p-3 bg-green-500 text-white font-semibold text-sm">
          ALL CATEGORIES
        </div>
        <div className="p-4 text-sm text-gray-500">
          No categories available
        </div>
      </div>
    );
  }
  
  // Calculate the height of the header for the mega menu scroll calculation
  const HEADER_HEIGHT = 43; // Estimate of the green header height (p-3 = 12px padding + text height)
  const FOOTER_HEIGHT = 47; // Estimate of the mega menu footer height (py-2.5 = 10px padding + text height)
  const MEGA_MENU_HEIGHT = 500; // Fixed height matching the hero section
  const SCROLLABLE_CONTENT_MAX_HEIGHT = MEGA_MENU_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;


  return (
    // Use fixed height h-[500px] to match the Hero Section height on desktop
    <div ref={sidebarRef} className="absolute left-0 top-0 w-64 h-[500px] bg-white shadow-lg z-40 border-r overflow-hidden">
      {/* Category Header Bar */}
      <div className="category-header-bar p-3 bg-green-500 text-white font-semibold text-sm pl-8 xl:pl-3">
        ALL CATEGORIES
      </div>
      
      <div className="relative h-[calc(100%-43px)] overflow-y-auto">
        {categories.map((category) => {
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
                className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors border-b border-gray-100 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">
                    <IconComponent size={16} />
                  </span>
                  <span className="truncate">{category.name}</span>
                </div>
                {category.subcategories.length > 0 && (
                  <ChevronRight size={12} className="text-gray-400" />
                )}
              </div>

              {/* Mega Menu Dropdown: Aligned to the Top of the Hero Section and fixed height */}
              {hoveredCategory?.id === category.id && category.subcategories.length > 0 && menuTopOffset !== null && (
                <div 
                  className="fixed ml-64 w-[954px] bg-white shadow-2xl border border-gray-200 z-[60] overflow-hidden h-[500px]"
                  style={{ 
                    // ALIGNMENT FIX: Aligns the menu with the calculated top edge of the Hero Section.
                    top: `${menuTopOffset}px`, 
                  }}
                >
                  {/* Sticky Header */}
                  <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 px-4 py-2.5 z-10">
                    <span className="text-sm font-bold text-orange-700 uppercase tracking-wider">
                      {category.name}
                    </span>
                  </div>
                  
                  {/* Scrollable Content */}
                  <div 
                    className="overflow-y-auto overflow-x-hidden p-4" 
                    // Calculate scrollable height based on fixed 500px total height minus header/footer.
                    style={{ maxHeight: `${SCROLLABLE_CONTENT_MAX_HEIGHT}px` }} 
                  >
                    <div className="grid grid-cols-8 gap-3">
                      {category.subcategories.map((subcategory: any) => {
                        const SubIcon = ShoppingBag;
                        return (
                          <div
                            key={subcategory.id}
                            onClick={(e) => handleSubcategoryClick(category, subcategory, e)}
                            className="flex flex-col items-center p-2 rounded-lg hover:bg-orange-50 hover:shadow-md transition-all duration-200 cursor-pointer group"
                          >
                            <div className="relative w-14 h-14 mb-1.5 rounded-md overflow-hidden bg-gray-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
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
                                <div className={`w-full h-full flex items-center justify-center ${subcategory.color || 'bg-gradient-to-br from-gray-200 to-gray-300'}`}>
                                  <SubIcon size={18} className="text-white opacity-80" />
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-700 text-center leading-tight font-medium group-hover:text-orange-600 transition-colors line-clamp-2 px-1">
                              {subcategory.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Sticky Footer */}
                  <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-4 py-2.5 shadow-sm">
                    <div
                      onClick={(e) => handleCategoryClick(category, e)}
                      className="text-sm text-orange-600 hover:text-orange-700 font-semibold cursor-pointer text-center py-1 hover:underline transition-all"
                    >
                      View All {category.name} →
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

        if (error) {
          console.error('Hero slides error:', error);
          throw error;
        }

        console.log('Hero slides loaded:', data);
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
    if (!isAutoPlaying || heroSlides.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, heroSlides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

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

  const heroHeight = isMobile ? 'h-[120px]' : 'h-[500px]';

  if (loading) {
    return (
      <section className={`relative ${heroHeight} bg-gray-200 animate-pulse ${!isMobile ? 'shadow-sm' : 'm-2 rounded-lg overflow-hidden'}`}>
        <CategorySidebar />
      </section>
    );
  }

  if (heroSlides.length === 0) {
    console.warn('No hero slides available');
    return (
      <section className={`relative ${heroHeight} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ${!isMobile ? 'shadow-sm' : 'm-1 overflow-hidden rounded-sm'}`}>
        <CategorySidebar />
        <div className={`absolute inset-0 ${!isMobile ? 'ml-64' : ''} flex items-center justify-center`}>
          <p className="text-white text-lg">No banner images available</p>
        </div>
      </section>
    );
  }

  const currentSlideData = heroSlides[currentSlide] ?? heroSlides[0];

  return (
    <section className={`relative ${heroHeight} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ${!isMobile ? 'shadow-sm' : 'm-1 overflow-hidden rounded-sm'}`}>
      <CategorySidebar />
      <div 
        className={`absolute inset-0 ${!isMobile ? 'ml-64' : ''} cursor-pointer`}
        onClick={handleSlideClick}
      >
        <LazyImage
          src={currentSlideData.image_url}
          alt={currentSlideData.title}
          priority
          width={1920}
          height={1080}
          className={`object-cover w-full h-full ${!isMobile ? 'max-h-[500px]' : 'max-h-[180px]'}`}
        />
        <div className={`absolute inset-0 bg-black/30 ${isMobile ? 'overflow-hidden' : ''}`} />
      </div>

      {heroSlides.length > 1 && (
        <div className={`absolute left-1/2 transform -translate-x-1/2 flex space-x-3 z-20 ${!isMobile ? 'bottom-8' : 'bottom-4'}`}>
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-12 bg-orange-500' 
                  : 'w-2 bg-white/60 hover:bg-white/80'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
});

EnhancedHeroSection.displayName = 'EnhancedHeroSection';

export default EnhancedHeroSection;


