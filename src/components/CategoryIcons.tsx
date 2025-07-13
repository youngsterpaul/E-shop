
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
  productImage?: string;
}

const categoryIcons: CategoryIcon[] = [
  {
    id: 'phones',
    name: 'Phones',
    icon: Smartphone,
    searchQuery: 'phone',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    productImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'laptops',
    name: 'Laptops',
    icon: Laptop,
    searchQuery: 'laptop',
    color: 'bg-gradient-to-br from-green-500 to-green-600',
    productImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'headphones',
    name: 'Audio',
    icon: Headphones,
    searchQuery: 'headphones',
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'cameras',
    name: 'Cameras',
    icon: Camera,
    searchQuery: 'camera',
    color: 'bg-gradient-to-br from-red-500 to-red-600',
    productImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'watches',
    name: 'Watches',
    icon: Watch,
    searchQuery: 'watch',
    color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: Gamepad2,
    searchQuery: 'gaming',
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    productImage: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'tv',
    name: 'TVs',
    icon: Tv,
    searchQuery: 'tv',
    color: 'bg-gradient-to-br from-pink-500 to-pink-600',
    productImage: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'speakers',
    name: 'Speakers',
    icon: Speaker,
    searchQuery: 'speaker',
    color: 'bg-gradient-to-br from-teal-500 to-teal-600',
    productImage: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'monitors',
    name: 'Monitors',
    icon: Monitor,
    searchQuery: 'monitor',
    color: 'bg-gradient-to-br from-orange-500 to-orange-600',
    productImage: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'tablets',
    name: 'Tablets',
    icon: Tablet,
    searchQuery: 'tablet',
    color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    productImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'networking',
    name: 'Network',
    icon: Router,
    searchQuery: 'router',
    color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    productImage: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'accessories',
    name: 'Power',
    icon: Battery,
    searchQuery: 'battery',
    color: 'bg-gradient-to-br from-gray-500 to-gray-600',
    productImage: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=400&q=80'
  }
];

const CategoryIcons = () => {
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  const handleCategoryClick = (searchQuery: string) => {
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  if (isMobile) {
    // Mobile version with modern icons
    return (
      <section className="py-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Shop by Category</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {categoryIcons.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.searchQuery)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md border border-gray-100"
                >
                  <div className={`${category.color} p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <IconComponent size={28} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-700 text-center font-medium group-hover:text-gray-900 transition-colors leading-tight">
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Desktop version with product images (Kilimall-style)
  return (
    <section className="py-12 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categoryIcons.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.searchQuery)}
                className="flex flex-col items-center justify-center cursor-pointer group"
              >
                <div className="relative w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 mb-4 rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200">
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
                      <div className={`absolute top-2 right-2 ${category.color} p-2 rounded-lg opacity-90`}>
                        <IconComponent size={16} className="text-white" />
                      </div>
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
