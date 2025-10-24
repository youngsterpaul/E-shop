import { useState, useEffect, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  Star, 
  TrendingUp, 
  ChevronRight,
  Smartphone,
  Laptop,
  Home,
  Car,
  Shirt,
  Book,
  Gamepad2,
  Baby,
  Heart,
  Wrench,
  Tv,
  Fan,
  Refrigerator
} from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface HeroSlide {
  id: string;
  title: string;
  image_url: string;
  link: string | null; // ✅ changed from "string | undefined"
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  icon: React.ReactNode;
  subcategories: string[];
  searchQuery: string; // Add search query for navigation
}

const categories: Category[] = [
  {
    id: 1,
    name: "Phones & Accessories",
    icon: <Smartphone size={16} />,
    searchQuery: "phones & accessories",
    subcategories: [
      "Smart Phones",
      "Featured Phones",
      "Refurbished Phones",
      "Cases & Covers",
      "Screen Protectors",
      "Power Banks",
      "Cables & Chargers"
    ]
  },
  {
    id: 2,
    name: "Computers & Accessories",
    icon: <Laptop size={16} />,
    searchQuery: "computers & accessories",
    subcategories: [
      "Brand New Laptops",
      "Refurbished Laptops",
      "Desktop Computers",
      "Laptops Bateries",
      "Laptops Chargers",
      "USB Flash Drives",
      "Keyboards & Mouse",
      "Routers",
    ]
  },
  {
    id: 3,
    name: "Home & Kitchen",
    icon: <Home size={16} />,
    searchQuery: "home & kitchen",
    subcategories: [
      "Sofa & Chairs",
      "Study & Kitchen Tables",
      "Matress & Pilows",
      "Duvet & Blankets",
      "Beds",
      "Utensils & Pans",
      "Gas Cookers",
    ]
  },
  {
    id: 4,
    name: "TV & Audio",
    icon: <Tv size={16} />,
    searchQuery: "tv & audio",
    subcategories: [
      "Smart TV",
      "Digital TV",
      "Home Theater Systems",
      "Woofers",
      "Earphones & Earpods",
      "Power & Cables",
      "TV Accessories"
    ]
  },
  {
    id: 5,
    name: "Fashion",
    icon: <Shirt size={16} />,
    searchQuery: "clothing",
    subcategories: [
      "Men Shoes & Sneakers",
      "Men Trousers",
      "Shirts & Jersey",
      "Women Shoes & Sneakers",
      "Women Trousers",
      "Bags",
      "Watches",
    ]
  },
  {
    id: 6,
    name: "Home Appliances",
    icon: <Refrigerator size={16} />,
    searchQuery: "home appliances",
    subcategories: [
      "Refrigerators",
      "Blenders",
      "Fans",
      "Electric Kettles",
      "Microwaves",
      "Washing Machines",
    ]
  },
  {
    id: 7,
    name: "Gaming",
    icon: <Gamepad2 size={16} />,
    searchQuery: "gaming console",
    subcategories: [
      "PlayStation Games",
      "Xbox Games",
      "Nintendo Games",
      "PC Games",
      "Gaming Accessories",
      "Virtual Reality"
    ]
  },
  {
    id: 8,
    name: "Health & Beauty",
    icon: <Heart size={16} />,
    searchQuery: "health & skincare",
    subcategories: [
      "Skincare",
      "Makeup",
      "Hair Care & Wigs",
      "Nail Art",
      "Fragrance & Sprays",
    ]
  },
  {
    id: 9,
    name: "Tools & Hardware",
    icon: <Wrench size={16} />,
    searchQuery: "tools hardware",
    subcategories: [
      "Hand Tools",
      "Power Tools",
      "Hardware",
      "Safety Equipment",
      "Measuring Tools",
      "Tool Storage"
    ]
  },
  {
    id: 10,
    name: "Baby & Kids",
    icon: <Baby size={16} />,
    searchQuery: "baby kids toys",
    subcategories: [
      "Baby Clothing",
      "Diapers",
      "Baby Food",
      "Toys",
      "Strollers",
      "Car Seats",
      "Baby Care"
    ]
  }
];

const CategorySidebar = memo(() => {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  // Add the category click handler
  const handleCategoryClick = (searchQuery: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // Add subcategory click handler
  const handleSubcategoryClick = (subcategory: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(subcategory.toLowerCase())}`);
  };

  if (isMobile) return null;

 return (
    <div className="absolute left-0 top-0 w-64 h-full bg-white shadow-lg z-40 border-r"> {/* Changed from z-30 to z-50 */}
      <div className="p-3 bg-green-500 text-white font-semibold text-sm pl-8 xl:pl-3">
        ALL CATEGORIES
      </div>
      
      <div className="relative pl-4 xl:pl-0">
        {categories.map((category) => (
          <div
            key={category.id}
            className="relative"
            onMouseEnter={() => setHoveredCategory(category.id)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div
              onClick={(e) => handleCategoryClick(category.searchQuery, e)}
              className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors border-b border-gray-100 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-900">{category.icon}</span>
                <span className="truncate">{category.name}</span>
              </div>
              <ChevronRight size={12} className="text-gray-400" />
            </div>

            {/* Subcategories Dropdown - Increased z-index */}
            {hoveredCategory === category.id && (
              <div className="absolute left-full top-0 w-56 bg-white shadow-xl border border-gray-200 z-[60] rounded-r-md"> {/* Changed from z-40 to z-[60] */}
                <div className="p-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {category.name}
                  </span>
                </div>
                <div className="py-1 max-h-96 overflow-y-auto">
                  {category.subcategories.map((subcategory, index) => (
                    <div
                      key={index}
                      onClick={(e) => handleSubcategoryClick(subcategory, e)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {subcategory}
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-100">
                  <div
                    onClick={(e) => handleCategoryClick(category.searchQuery, e)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                  >
                    View All {category.name} →
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
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

  // Fetch hero slides from database
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

  // Auto-play carousel
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

  // Loading state
  if (loading) {
    const heroHeight = isMobile ? 'h-[180px]' : 'h-[500px]';
    return (
      <section className={`relative ${heroHeight} bg-gray-200 animate-pulse ${!isMobile ? 'shadow-sm' : 'm-2 rounded-lg overflow-hidden'}`}>
        <CategorySidebar />
      </section>
    );
  }

  // No slides available
  if (heroSlides.length === 0) {
    return null;
  }

  const currentSlideData = heroSlides[currentSlide] ?? heroSlides[0];
  const heroHeight = isMobile ? 'h-[180px]' : 'h-[500px]';

  return (
    <section className={`relative ${heroHeight} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 /z-40 ${!isMobile ? 'shadow-sm' : 'm-2 rounded-lg overflow-hidden'}`}>
      {/* Categories Sidebar */}
      <CategorySidebar />
      {/* Background Image with Overlay */}
      <div 
        className={`absolute inset-0 ${!isMobile ? 'ml-64' : ''}`}
        onClick={handleSlideClick}
        >
        <LazyImage
          src={currentSlideData.image_url}
          alt={currentSlideData.title}
          priority
          width={1920}
          height={1080}
          className={`object-cover ${!isMobile ? 'max-h-[500px] w-full' : 'max-h-[180px]'}`}
        />
        <div className={`absolute inset-0 bg-black/50 ${isMobile ? 'overflow-hidden' : ''}`} />
      </div>

      {/* Slide Indicators */}
      <div className={`absolute left-1/2 transform -translate-x-1/2 flex space-x-3 z-20  ${!isMobile ? 'bottom-8':'bottom-4'}`}>
        {heroSlides.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-12 bg-orange-500' 
                : 'w-2 bg-white/60 hover:bg-white/80'
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
});

EnhancedHeroSection.displayName = 'EnhancedHeroSection';


export default EnhancedHeroSection;
