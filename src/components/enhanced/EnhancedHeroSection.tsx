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
  Wrench
} from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import hero1Image from '@/assets/images/hero1.png';
import hero2Image from '@/assets/images/hero2.webp';
import hero3Image from '@/assets/images/hero3.webp';
import hero4Image from '@/assets/images/hero4.png';
import hero5Image from '@/assets/images/hero5.png';

interface HeroSlide {
  id: number;
  title: string;
  image: string;
}

interface Category {
  id: number;
  name: string;
  icon: React.ReactNode;
  subcategories: string[];
  searchQuery: string; // Add search query for navigation
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Summer Tech Sale",
    image: hero1Image,
  },
  {
    id: 2,
    title: "New Arrivals",
    image: hero2Image,
  },
  {
    id: 3,
    title: "Smart Living",
    image: hero3Image,
  },
  {
    id: 4,
    title: "Smart Living",
    image: hero4Image,
  },
    {
    id: 5,
    title: "Smart Living",
    image: hero5Image,
  },
];

const categories: Category[] = [
  {
    id: 1,
    name: "Phones & Tablets",
    icon: <Smartphone size={16} />,
    searchQuery: "phone tablet",
    subcategories: [
      "Mobile Phones",
      "Tablets",
      "Phone Accessories",
      "Cases & Covers",
      "Screen Protectors",
      "Power Banks",
      "Cables & Chargers"
    ]
  },
  {
    id: 2,
    name: "Electronics",
    icon: <Laptop size={16} />,
    searchQuery: "electronics laptop computer",
    subcategories: [
      "Laptops",
      "Desktop Computers",
      "Monitors",
      "Keyboards & Mice",
      "Headphones",
      "Speakers",
      "Cameras",
      "Gaming Consoles"
    ]
  },
  {
    id: 3,
    name: "Home & Garden",
    icon: <Home size={16} />,
    searchQuery: "home garden furniture",
    subcategories: [
      "Furniture",
      "Home Decor",
      "Kitchen Appliances",
      "Bedding",
      "Bath & Shower",
      "Garden Tools",
      "Outdoor Furniture"
    ]
  },
  {
    id: 4,
    name: "Automotive",
    icon: <Car size={16} />,
    searchQuery: "car electronics automotive",
    subcategories: [
      "Car Electronics",
      "Car Parts",
      "Tires",
      "Car Care",
      "Motorcycle Parts",
      "Car Accessories",
      "Tools & Equipment"
    ]
  },
  {
    id: 5,
    name: "Fashion",
    icon: <Shirt size={16} />,
    searchQuery: "fashion clothing shoes",
    subcategories: [
      "Men's Clothing",
      "Women's Clothing",
      "Children's Clothing",
      "Shoes",
      "Bags",
      "Jewelry",
      "Watches",
      "Sunglasses"
    ]
  },
  {
    id: 6,
    name: "Books & Education",
    icon: <Book size={16} />,
    searchQuery: "books education stationery",
    subcategories: [
      "Academic Books",
      "Fiction",
      "Children's Books",
      "Educational Toys",
      "Stationery",
      "Art Supplies"
    ]
  },
  {
    id: 7,
    name: "Gaming",
    icon: <Gamepad2 size={16} />,
    searchQuery: "gaming games console",
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
  },
  {
    id: 9,
    name: "Health & Beauty",
    icon: <Heart size={16} />,
    searchQuery: "health beauty skincare",
    subcategories: [
      "Skincare",
      "Makeup",
      "Hair Care",
      "Fragrances",
      "Health Supplements",
      "Medical Devices"
    ]
  },
  {
    id: 10,
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
      <div className="p-3 bg-green-500 text-white font-semibold text-sm">
        ALL CATEGORIES
      </div>
      
      <div className="relative">
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  // Add the category click handler to the main component
  const handleCategoryClick = (searchQuery: string) => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentSlideData = heroSlides[currentSlide];

  // Dynamic height based on device type
  const heroHeight = isMobile ? 'h-[180px]' : 'h-[500px]';

  return (
    <section className={`relative /overflow-hidden ${heroHeight} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 /z-40 ${!isMobile ? 'shadow-sm' : 'm-2 rounded-lg'}`}>
      {/* Categories Sidebar */}
      <CategorySidebar />
      {/* Background Image with Overlay */}
      <div className={`absolute inset-0 ${!isMobile ? 'ml-64' : ''}`}>
        <LazyImage
          src={currentSlideData.image}
          alt={currentSlideData.title}
          priority={true}
          width={100}
          height={100}
          className={`object-cove ${!isMobile ? 'max-h-[500px] max-w-[full]' : 'max-h-[180px]'}`}
        />
        <div className="absolute inset-0 bg-black/50" />
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