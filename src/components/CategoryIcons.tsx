
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { 
  Smartphone, 
  Laptop, 
  Headphones, 
  Camera, 
  Watch, 
  Gamepad2, 
  Tv, 
  Speaker,
  Monitor,
  Tablet,
  Router,
  Battery
} from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import OptimizedImage from '@/components/OptimizedImage';

interface CategoryIcon {
  id: string;
  name: string;
  icon: LucideIcon;
  searchQuery: string;
  color: string;
  iconColor: string;
  productImage?: string;
}

const categoryIcons: CategoryIcon[] = [
  {
    id: 'phones',
    name: 'Phones',
    icon: Smartphone,
    searchQuery: 'phone',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
    productImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'laptops',
    name: 'Laptops',
    icon: Laptop,
    searchQuery: 'laptop',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
    productImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'headphones',
    name: 'Audio',
    icon: Headphones,
    searchQuery: 'headphones',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'cameras',
    name: 'Cameras',
    icon: Camera,
    searchQuery: 'camera',
    color: 'bg-red-50',
    iconColor: 'text-red-600',
    productImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'watches',
    name: 'Watches',
    icon: Watch,
    searchQuery: 'watch',
    color: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: Gamepad2,
    searchQuery: 'gaming',
    color: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    productImage: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'tv',
    name: 'TVs',
    icon: Tv,
    searchQuery: 'tv',
    color: 'bg-pink-50',
    iconColor: 'text-pink-600',
    productImage: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'speakers',
    name: 'Speakers',
    icon: Speaker,
    searchQuery: 'speaker',
    color: 'bg-teal-50',
    iconColor: 'text-teal-600',
    productImage: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'monitors',
    name: 'Monitors',
    icon: Monitor,
    searchQuery: 'monitor',
    color: 'bg-orange-50',
    iconColor: 'text-orange-600',
    productImage: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'tablets',
    name: 'Tablets',
    icon: Tablet,
    searchQuery: 'tablet',
    color: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    productImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'networking',
    name: 'Network',
    icon: Router,
    searchQuery: 'router',
   color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    productImage: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'accessories',
    name: 'Power',
    icon: Battery,
    searchQuery: 'battery',
    color: 'bg-gray-50',
    iconColor: 'text-gray-600',
    productImage: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=400&q=80'
  }
];

const CategoryIcons = () => {
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const gridCols = isMobile 
    ? "grid-cols-2" 
    : "grid-cols-6";

  const handleCategoryClick = (searchQuery: string) => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  if (isMobile) {
    // Mobile version with modern icons
    return (
      <div className="md:hidden grid grid-cols-4 gap-3 mx-2 my-4">
        {categoryIcons.slice(0, 8).map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.searchQuery)}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer group border border-gray-100"
            >
              <div className={`${category.color} p-2.5 rounded-full mb-2 group-hover:scale-105 transition-transform duration-200`}>
                <IconComponent size={20} className={category.iconColor} />
              </div>
              <span className="text-xs text-gray-700 text-center font-medium leading-tight">
                {category.name}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop version with product images (Kilimall-style)
  return (
    <section className={`mx-0 lg:mx-16 bg-gradient-to-br from-gray-50 to-white ${!isMobile ? 'mt-4' : ''}`}>
      <div className="container mx-auto px-4">

        <h2 className="border-b items-center text-gray-600 mx-auto px-4 py-2 text-sm font-semibold bg-white">
          SHOP BY CATEGORY
        </h2>
        <div className={`grid ${gridCols} gap-3 md:gap-4 bg-white p-4 shadow-sm`}>
          {categoryIcons.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.searchQuery)}
                className="flex flex-col items-center justify-center cursor-pointer group"
              >
                <div className="relative w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 mb-4 overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200">
                  {category.productImage ? (
                    <>
                      <OptimizedImage
                        src={category.productImage}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        aspectRatio="square"
                        priority={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${category.color}`}>
                      <IconComponent size={32} className="text-white" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-800 text-center group-hover:text-gray-900 transition-colors">
                  {category.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryIcons;
