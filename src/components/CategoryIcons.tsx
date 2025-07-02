
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

interface CategoryIcon {
  id: string;
  name: string;
  icon: LucideIcon;
  searchQuery: string;
  color: string;
}

const categoryIcons: CategoryIcon[] = [
  {
    id: 'phones',
    name: 'Phones',
    icon: Smartphone,
    searchQuery: 'phone',
    color: 'bg-blue-500'
  },
  {
    id: 'laptops',
    name: 'Laptops',
    icon: Laptop,
    searchQuery: 'laptop',
    color: 'bg-green-500'
  },
  {
    id: 'headphones',
    name: 'Audio',
    icon: Headphones,
    searchQuery: 'headphones',
    color: 'bg-purple-500'
  },
  {
    id: 'cameras',
    name: 'Cameras',
    icon: Camera,
    searchQuery: 'camera',
    color: 'bg-red-500'
  },
  {
    id: 'watches',
    name: 'Watches',
    icon: Watch,
    searchQuery: 'watch',
    color: 'bg-yellow-500'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: Gamepad2,
    searchQuery: 'gaming',
    color: 'bg-indigo-500'
  },
  {
    id: 'tv',
    name: 'TVs',
    icon: Tv,
    searchQuery: 'tv',
    color: 'bg-pink-500'
  },
  {
    id: 'speakers',
    name: 'Speakers',
    icon: Speaker,
    searchQuery: 'speaker',
    color: 'bg-teal-500'
  },
  {
    id: 'monitors',
    name: 'Monitors',
    icon: Monitor,
    searchQuery: 'monitor',
    color: 'bg-orange-500'
  },
  {
    id: 'tablets',
    name: 'Tablets',
    icon: Tablet,
    searchQuery: 'tablet',
    color: 'bg-cyan-500'
  },
  {
    id: 'networking',
    name: 'Network',
    icon: Router,
    searchQuery: 'router',
    color: 'bg-emerald-500'
  },
  {
    id: 'accessories',
    name: 'Power',
    icon: Battery,
    searchQuery: 'battery',
    color: 'bg-gray-500'
  }
];

const CategoryIcons = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (searchQuery: string) => {
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
          {categoryIcons.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.searchQuery)}
                className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-50 transition-all duration-300 cursor-pointer group"
              >
                <div className={`${category.color} p-3 rounded-full mb-2 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <IconComponent size={24} className="text-white" />
                </div>
                <span className="text-xs text-gray-700 text-center font-medium group-hover:text-gray-900 transition-colors">
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
