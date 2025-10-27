import { useNavigate } from 'react-router-dom';
import { Car, HardDrive, Home, Keyboard, Mouse, Printer, Usb, Wifi } from 'lucide-react';
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
  icon: any;
  categoryId: number;
  subcategoryId?: number;
  categoryName: string;
  subcategoryName?: string;
  color: string;
  iconColor: string;
  productImage?: string;
}

interface CategoryIconsProps {
  showAll?: boolean;
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

const categoryIcons: CategoryIcon[] = [
  {
    id: 'phones',
    name: 'Phones',
    icon: Smartphone,
    categoryId: 1,
    categoryName: 'Phones & Accessories',
    subcategoryId: 101,
    subcategoryName: 'Smart Phones',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
    productImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'laptops',
    name: 'Laptops',
    icon: Laptop,
    categoryId: 2,
    categoryName: 'Computers & Accessories',
    subcategoryId: 201,
    subcategoryName: 'Brand New Laptops',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
    productImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'headphones',
    name: 'Audio',
    icon: Headphones,
    categoryId: 4,
    categoryName: 'TV & Audio',
    subcategoryId: 405,
    subcategoryName: 'Earphones & Earpods',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'cameras',
    name: 'Cameras',
    icon: Camera,
    categoryId: 2,
    categoryName: 'Computers & Accessories',
    color: 'bg-red-50',
    iconColor: 'text-red-600',
    productImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'watches',
    name: 'Watches',
    icon: Watch,
    categoryId: 5,
    categoryName: 'Fashion',
    subcategoryId: 507,
    subcategoryName: 'Watches',
    color: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: Gamepad2,
    categoryId: 7,
    categoryName: 'Gaming',
    color: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    productImage: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'tv',
    name: 'TVs',
    icon: Tv,
    categoryId: 4,
    categoryName: 'TV & Audio',
    subcategoryId: 401,
    subcategoryName: 'Smart TV',
    color: 'bg-pink-50',
    iconColor: 'text-pink-600',
    productImage: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'speakers',
    name: 'Speakers',
    icon: Speaker,
    categoryId: 4,
    categoryName: 'TV & Audio',
    subcategoryId: 403,
    subcategoryName: 'Home Theater Systems',
    color: 'bg-teal-50',
    iconColor: 'text-teal-600',
    productImage: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'monitors',
    name: 'Monitors',
    icon: Monitor,
    categoryId: 2,
    categoryName: 'Computers & Accessories',
    color: 'bg-orange-50',
    iconColor: 'text-orange-600',
    productImage: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'tablets',
    name: 'Tablets',
    icon: Tablet,
    categoryId: 1,
    categoryName: 'Phones & Accessories',
    color: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    productImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'networking',
    name: 'Network',
    icon: Router,
    categoryId: 2,
    categoryName: 'Computers & Accessories',
    subcategoryId: 208,
    subcategoryName: 'Routers',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    productImage: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'accessories',
    name: 'Power',
    icon: Battery,
    categoryId: 1,
    categoryName: 'Phones & Accessories',
    subcategoryId: 106,
    subcategoryName: 'Power Banks',
    color: 'bg-gray-50',
    iconColor: 'text-gray-600',
    productImage: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'keyboards',
    name: 'Keyboards',
    icon: Keyboard,
    categoryId: 2,
    categoryName: 'Computers & Accessories',
    subcategoryId: 207,
    subcategoryName: 'Keyboards & Mouse',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
    productImage: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'mice',
    name: 'Mice',
    icon: Mouse,
    categoryId: 2,
    categoryName: 'Computers & Accessories',
    subcategoryId: 207,
    subcategoryName: 'Keyboards & Mouse',
    color: 'bg-rose-50',
    iconColor: 'text-rose-600',
    productImage: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: HardDrive,
    categoryId: 2,
    categoryName: 'Computers & Accessories',
    subcategoryId: 206,
    subcategoryName: 'USB Flash Drives',
    color: 'bg-slate-50',
    iconColor: 'text-slate-600',
    productImage: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'usb',
    name: 'USB & Cables',
    icon: Usb,
    categoryId: 1,
    categoryName: 'Phones & Accessories',
    subcategoryId: 107,
    subcategoryName: 'Cables & Chargers',
    color: 'bg-amber-50',
    iconColor: 'text-amber-600',
    productImage: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'printers',
    name: 'Printers',
    icon: Printer,
    categoryId: 2,
    categoryName: 'Computers & Accessories',
    color: 'bg-lime-50',
    iconColor: 'text-lime-600',
    productImage: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'wifi',
    name: 'WiFi & Internet',
    icon: Wifi,
    categoryId: 2,
    categoryName: 'Computers & Accessories',
    subcategoryId: 208,
    subcategoryName: 'Routers',
    color: 'bg-sky-50',
    iconColor: 'text-sky-600',
    productImage: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'automotive',
    name: 'Car Tech',
    icon: Car,
    categoryId: 2,
    categoryName: 'Computers & Accessories',
    color: 'bg-red-50',
    iconColor: 'text-red-600',
    productImage: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'smart-home',
    name: 'Smart Home',
    icon: Home,
    categoryId: 3,
    categoryName: 'Home & Kitchen',
    color: 'bg-violet-50',
    iconColor: 'text-violet-600',
    productImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80'
  }
];

const CategoryIcons: React.FC<CategoryIconsProps> = ({ showAll = false }) => {
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  
  const categoriesToShow = isMobile && !showAll 
    ? categoryIcons.slice(0, 8) 
    : categoryIcons;
  
  const gridCols = isMobile 
    ? "grid-cols-4" 
    : showAll || categoriesToShow.length > 10
      ? "grid-cols-10"
      : "grid-cols-10";

  const handleCategoryClick = (category: CategoryIcon) => {
    const url = generateCategoryUrl(
      category.categoryName, 
      category.categoryId, 
      category.subcategoryName, 
      category.subcategoryId
    );
    navigate(url);
  };

  if (isMobile) {
    return (
      <div className="grid grid-cols-4 gap-3 mx-2 my-4">
        {categoriesToShow.map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
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

  return (
    <section className="container shadow-sm mx-auto px-8 block bottom-0 left-0 right-0 bg-white border-t border-gray-200/50">
      <h2 className="border-b my-4 items-center text-gray-600 mx-auto py-2 text-xl font-bold bg-white">
        SHOP BY CATEGORY
      </h2>
      <div className={`grid ${gridCols} gap-3 bg-white p-4 shadow-sm`}>
        {categoriesToShow.map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="relative w-24 h-24 mb-4 overflow-hidden bg-transparent shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
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
    </section>
  );
};

export default CategoryIcons;