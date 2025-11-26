import { useNavigate } from 'react-router-dom';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import OptimizedImage from '@/components/OptimizedImage';
import { useCategoryIcons } from '@/hooks/useCategoryIcons';
import CategorySkeleton from './skeletons/CategorySkeleton';

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

// Helper function to generate category URL
const generateCategoryUrl = (
  categoryName: string, 
  categoryId: number, 
  categorySlug?: string | null,
  subcategoryName?: string | null, 
  subcategoryId?: number | null,
  subcategorySlug?: string | null
): string => {
  // Use existing slug or generate one
  const catSlug = categorySlug || generateSlug(categoryName);
  
  if (subcategoryName && subcategoryId) {
    const subSlug = subcategorySlug || generateSlug(subcategoryName);
    return `/category/${catSlug}/${subSlug}?id=${subcategoryId}&parent=${categoryId}&source=category|${encodeURIComponent(categoryName)}|${encodeURIComponent(subcategoryName)}`;
  }
  
  return `/category/${catSlug}?id=${categoryId}&form=category&source=category|allCategory|${encodeURIComponent(categoryName)}`;
};

const CategoryIcons: React.FC<CategoryIconsProps> = ({ showAll = false }) => {
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const { data: categoryIcons, isLoading, error } = useCategoryIcons();
  
  if (isLoading) {
    return <CategorySkeleton showAll={showAll} />;
  }
  
  if (error) {
    console.error('Category icons error:', error);
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500">Failed to load categories</div>
      </div>
    );
  }
  
  if (!categoryIcons || categoryIcons.length === 0) {
    return null;
  }
  
  const categoriesToShow = isMobile && !showAll 
    ? categoryIcons.slice(0, 0) 
    : categoryIcons;
  
  const gridCols = isMobile 
    ? "grid-cols-4" 
    : showAll || categoriesToShow.length > 10
      ? "grid-cols-10"
      : "grid-cols-10";

  const handleCategoryClick = (category: any) => {
    const url = generateCategoryUrl(
      category.categoryName, 
      category.categoryId,
      category.categorySlug,
      category.subcategoryName, 
      category.subcategoryId,
      category.subcategorySlug
    );
    navigate(url);
  };

  if (isMobile) {
    return (
      <div className="grid grid-cols-4 gap-y-2 px-2 my-2 rounded-lg">
        {categoriesToShow.map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="flex flex-col items-center justify-center p-1 bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer group max-w-[800px]"
            >
              <div className="relative mb-4 rounded-sm overflow-hidden bg-transparent .shadow-lg .hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                {category.productImage ? (
                  (() => {
                    const normalizedSrc = category.productImage.replace(/^http:\/\//, 'https://');
                    return (
                      <>
                        <OptimizedImage
                          src={normalizedSrc}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          aspectRatio="square"
                          priority={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    );
                  })()
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${category.color}`}>
                    <IconComponent size={32} className="text-white" />
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-700 text-center leading-tight">
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
      <div className={`grid ${gridCols} gap-y-2 bg-white p-4`}>
        {categoriesToShow.map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="flex flex-col items-center justify-center cursor-pointer group hover:shadow-lg hover:rounded-lg py-1"
            >
              <div className="relative w-24 h-24 mb-4 overflow-hidden bg-transparent transition-all duration-300 group-hover:scale-105 transition-opacity duration-300">
                {category.productImage ? (
                  <>
                    <OptimizedImage
                      src={category.productImage}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      aspectRatio="square"
                      priority={false}
                    />
                    <div className="absolute inset-0" />
                  </>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${category.color}`}>
                    <IconComponent size={32} className="text-white" />
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-800 text-center group-hover:text-gray-900 transition-colors">
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