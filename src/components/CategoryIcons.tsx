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
        <div className="text-destructive">Failed to load categories</div>
      </div>
    );
  }
  
  if (!categoryIcons || categoryIcons.length === 0) {
    return null;
  }
  
  const categoriesToShow = isMobile && !showAll 
    ? categoryIcons.slice(0, 8) 
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
      <div className="grid grid-cols-4 gap-y-3 px-3 py-4 bg-background">
        {categoriesToShow.map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
            >
              <div className="relative w-16 h-16 mb-2 rounded-xl overflow-hidden bg-muted/30 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    );
                  })()
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${category.color}`}>
                    <IconComponent size={28} className="text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs text-foreground text-center leading-tight font-medium line-clamp-2">
                {category.name}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className="bg-card rounded-xl border border-border/50 shadow-sm">
      <h2 className="px-6 py-4 text-lg font-semibold text-foreground border-b border-border/50">
        Shop by Category
      </h2>
      <div className={`grid ${gridCols} gap-4 p-6`}>
        {categoriesToShow.map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="flex flex-col items-center justify-center cursor-pointer group p-3 rounded-xl hover:bg-muted/50 transition-all duration-200"
            >
              <div className="relative w-20 h-20 mb-3 rounded-xl overflow-hidden bg-muted/30 shadow-sm group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                {category.productImage ? (
                  <>
                    <OptimizedImage
                      src={category.productImage}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      aspectRatio="square"
                      priority={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${category.color}`}>
                    <IconComponent size={32} className="text-white" />
                  </div>
                )}
              </div>
              <span className="text-sm text-foreground text-center font-medium group-hover:text-primary transition-colors line-clamp-2">
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
