import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  ChevronRight,
  Smartphone,
  Laptop,
  Home,
  Tv,
  Shirt,
  Refrigerator,
  Gamepad2,
  Heart,
  Wrench,
  Baby
} from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

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

interface Category {
  id: number;
  name: string;
  slug: string; // URL-friendly version of name
  icon: React.ReactNode;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: number;
  name: string;
  slug: string;
}

// Helper function to generate slug from category name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/&/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

// Helper function to generate category URL like Kilimall
const generateCategoryUrl = (categoryName: string, categoryId: number, subcategoryName?: string, subcategoryId?: number): string => {
  const categorySlug = generateSlug(categoryName);
  
  if (subcategoryName && subcategoryId) {
    const subcategorySlug = generateSlug(subcategoryName);
    return `/category/${categorySlug}/${subcategorySlug}?id=${subcategoryId}&parent=${categoryId}&source=category|${encodeURIComponent(categoryName)}|${encodeURIComponent(subcategoryName)}`;
  }
  
  return `/category/${categorySlug}?id=${categoryId}&form=category&source=category|allCategory|${encodeURIComponent(categoryName)}`;
};

const categories: Category[] = [
  {
    id: 1,
    name: "Phones & Accessories",
    slug: "phones-accessories",
    icon: <Smartphone size={16} />,
    subcategories: [
      { id: 101, name: "Smart Phones", slug: "smart-phones" },
      { id: 102, name: "Featured Phones", slug: "featured-phones" },
      { id: 103, name: "Refurbished Phones", slug: "refurbished-phones" },
      { id: 104, name: "Cases & Covers", slug: "cases-covers" },
      { id: 105, name: "Screen Protectors", slug: "screen-protectors" },
      { id: 106, name: "Power Banks", slug: "power-banks" },
      { id: 107, name: "Cables & Chargers", slug: "cables-chargers" }
    ]
  },
  {
    id: 2,
    name: "Computers & Accessories",
    slug: "computers-accessories",
    icon: <Laptop size={16} />,
    subcategories: [
      { id: 201, name: "Brand New Laptops", slug: "brand-new-laptops" },
      { id: 202, name: "Refurbished Laptops", slug: "refurbished-laptops" },
      { id: 203, name: "Desktop Computers", slug: "desktop-computers" },
      { id: 204, name: "Laptops Batteries", slug: "laptops-batteries" },
      { id: 205, name: "Laptops Chargers", slug: "laptops-chargers" },
      { id: 206, name: "USB Flash Drives", slug: "usb-flash-drives" },
      { id: 207, name: "Keyboards & Mouse", slug: "keyboards-mouse" },
      { id: 208, name: "Routers", slug: "routers" }
    ]
  },
  {
    id: 3,
    name: "Home & Kitchen",
    slug: "home-kitchen",
    icon: <Home size={16} />,
    subcategories: [
      { id: 301, name: "Sofa & Chairs", slug: "sofa-chairs" },
      { id: 302, name: "Study & Kitchen Tables", slug: "study-kitchen-tables" },
      { id: 303, name: "Mattress & Pillows", slug: "mattress-pillows" },
      { id: 304, name: "Duvet & Blankets", slug: "duvet-blankets" },
      { id: 305, name: "Beds", slug: "beds" },
      { id: 306, name: "Utensils & Pans", slug: "utensils-pans" },
      { id: 307, name: "Gas Cookers", slug: "gas-cookers" }
    ]
  },
  {
    id: 4,
    name: "TV & Audio",
    slug: "tv-audio",
    icon: <Tv size={16} />,
    subcategories: [
      { id: 401, name: "Smart TV", slug: "smart-tv" },
      { id: 402, name: "Digital TV", slug: "digital-tv" },
      { id: 403, name: "Home Theater Systems", slug: "home-theater-systems" },
      { id: 404, name: "Woofers", slug: "woofers" },
      { id: 405, name: "Earphones & Earpods", slug: "earphones-earpods" },
      { id: 406, name: "Power & Cables", slug: "power-cables" },
      { id: 407, name: "TV Accessories", slug: "tv-accessories" }
    ]
  },
  {
    id: 5,
    name: "Fashion",
    slug: "fashion",
    icon: <Shirt size={16} />,
    subcategories: [
      { id: 501, name: "Men Shoes & Sneakers", slug: "men-shoes-sneakers" },
      { id: 502, name: "Men Trousers", slug: "men-trousers" },
      { id: 503, name: "Shirts & Jersey", slug: "shirts-jersey" },
      { id: 504, name: "Women Shoes & Sneakers", slug: "women-shoes-sneakers" },
      { id: 505, name: "Women Trousers", slug: "women-trousers" },
      { id: 506, name: "Bags", slug: "bags" },
      { id: 507, name: "Watches", slug: "watches" }
    ]
  },
  {
    id: 6,
    name: "Home Appliances",
    slug: "home-appliances",
    icon: <Refrigerator size={16} />,
    subcategories: [
      { id: 601, name: "Refrigerators", slug: "refrigerators" },
      { id: 602, name: "Blenders", slug: "blenders" },
      { id: 603, name: "Fans", slug: "fans" },
      { id: 604, name: "Electric Kettles", slug: "electric-kettles" },
      { id: 605, name: "Microwaves", slug: "microwaves" },
      { id: 606, name: "Washing Machines", slug: "washing-machines" }
    ]
  },
  {
    id: 7,
    name: "Gaming",
    slug: "gaming",
    icon: <Gamepad2 size={16} />,
    subcategories: [
      { id: 701, name: "PlayStation Games", slug: "playstation-games" },
      { id: 702, name: "Xbox Games", slug: "xbox-games" },
      { id: 703, name: "Nintendo Games", slug: "nintendo-games" },
      { id: 704, name: "PC Games", slug: "pc-games" },
      { id: 705, name: "Gaming Accessories", slug: "gaming-accessories" },
      { id: 706, name: "Virtual Reality", slug: "virtual-reality" }
    ]
  },
  {
    id: 8,
    name: "Health & Beauty",
    slug: "health-beauty",
    icon: <Heart size={16} />,
    subcategories: [
      { id: 801, name: "Skincare", slug: "skincare" },
      { id: 802, name: "Makeup", slug: "makeup" },
      { id: 803, name: "Hair Care & Wigs", slug: "hair-care-wigs" },
      { id: 804, name: "Nail Art", slug: "nail-art" },
      { id: 805, name: "Fragrance & Sprays", slug: "fragrance-sprays" }
    ]
  },
  {
    id: 9,
    name: "Tools & Hardware",
    slug: "tools-hardware",
    icon: <Wrench size={16} />,
    subcategories: [
      { id: 901, name: "Hand Tools", slug: "hand-tools" },
      { id: 902, name: "Power Tools", slug: "power-tools" },
      { id: 903, name: "Hardware", slug: "hardware" },
      { id: 904, name: "Safety Equipment", slug: "safety-equipment" },
      { id: 905, name: "Measuring Tools", slug: "measuring-tools" },
      { id: 906, name: "Tool Storage", slug: "tool-storage" }
    ]
  },
  {
    id: 10,
    name: "Baby & Kids",
    slug: "baby-kids",
    icon: <Baby size={16} />,
    subcategories: [
      { id: 1001, name: "Baby Clothing", slug: "baby-clothing" },
      { id: 1002, name: "Diapers", slug: "diapers" },
      { id: 1003, name: "Baby Food", slug: "baby-food" },
      { id: 1004, name: "Toys", slug: "toys" },
      { id: 1005, name: "Strollers", slug: "strollers" },
      { id: 1006, name: "Car Seats", slug: "car-seats" },
      { id: 1007, name: "Baby Care", slug: "baby-care" }
    ]
  }
];

const CategorySidebar = memo(() => {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  const handleCategoryClick = (category: Category, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    const url = generateCategoryUrl(category.name, category.id);
    navigate(url);
  };

  const handleSubcategoryClick = (category: Category, subcategory: Subcategory, e: React.MouseEvent) => {
    e.preventDefault();
    const url = generateCategoryUrl(category.name, category.id, subcategory.name, subcategory.id);
    navigate(url);
  };

  if (isMobile) return null;

  return (
    <div className="absolute left-0 top-0 w-64 h-full bg-white shadow-lg z-40 border-r">
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
              onClick={(e) => handleCategoryClick(category, e)}
              className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors border-b border-gray-100 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-900">{category.icon}</span>
                <span className="truncate">{category.name}</span>
              </div>
              <ChevronRight size={12} className="text-gray-400" />
            </div>

            {hoveredCategory === category.id && (
              <div className="absolute left-full top-0 w-56 bg-white shadow-xl border border-gray-200 z-[60] rounded-r-md">
                <div className="p-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {category.name}
                  </span>
                </div>
                <div className="py-1 max-h-96 overflow-y-auto">
                  {category.subcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      onClick={(e) => handleSubcategoryClick(category, subcategory, e)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {subcategory.name}
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-100">
                  <div
                    onClick={(e) => handleCategoryClick(category, e)}
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

  if (loading) {
    const heroHeight = isMobile ? 'h-[100px]' : 'h-[500px]';
    return (
      <section className={`relative ${heroHeight} bg-gray-200 animate-pulse ${!isMobile ? 'shadow-sm' : 'm-2 rounded-lg overflow-hidden'}`}>
        <CategorySidebar />
      </section>
    );
  }

  if (heroSlides.length === 0) {
    return null;
  }

  const currentSlideData = heroSlides[currentSlide] ?? heroSlides[0];
  const heroHeight = isMobile ? 'h-[100px]' : 'h-[500px]';

  return (
    <section className={`relative ${heroHeight} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ${!isMobile ? 'shadow-sm' : 'm-2 rounded-lg overflow-hidden'}`}>
      <CategorySidebar />
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

      <div className={`absolute left-1/2 transform -translate-x-1/2 flex space-x-3 z-20 ${!isMobile ? 'bottom-8' : 'bottom-4'}`}>
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
