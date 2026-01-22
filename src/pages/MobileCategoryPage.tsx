import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Search, Grid3X3 } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import SiteBreadcrumb from '@/components/Breadcrumb';
import { SEOHelmet } from '@/components/SEOHelmet';
import { useCategoryHierarchy, CategoryWithHierarchy, SubcategoryWithIcon } from '@/hooks/useCategoryHierarchy';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import OptimizedImage from '@/components/OptimizedImage';
import * as LucideIcons from 'lucide-react';

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/&/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

const generateCategoryUrl = (
  categoryName: string,
  categoryId: number,
  categorySlug?: string | null,
  subcategoryName?: string | null,
  subcategoryId?: number | null,
  subcategorySlug?: string | null
): string => {
  const catSlug = categorySlug || generateSlug(categoryName);

  if (subcategoryName && subcategoryId) {
    const subSlug = subcategorySlug || generateSlug(subcategoryName);
    return `/category/${catSlug}/${subSlug}?id=${subcategoryId}&parent=${categoryId}&source=category|${encodeURIComponent(categoryName)}|${encodeURIComponent(subcategoryName)}`;
  }

  return `/category/${catSlug}?id=${categoryId}&form=category&source=category|allCategory|${encodeURIComponent(categoryName)}`;
};

const CategorySkeleton = () => (
  <div className="space-y-3 p-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="w-5 h-5 rounded-full" />
      </div>
    ))}
  </div>
);

interface SubcategoryItemProps {
  subcategory: SubcategoryWithIcon;
  parentCategory: CategoryWithHierarchy;
  onNavigate: () => void;
}

const SubcategoryItem = ({ subcategory, parentCategory, onNavigate }: SubcategoryItemProps) => {
  const iconName = subcategory.iconName || 'Tag';
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Tag;

  return (
    <div
      onClick={onNavigate}
      className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/60 transition-all duration-200 cursor-pointer group"
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0">
        {subcategory.productImage ? (
          <OptimizedImage
            src={subcategory.productImage.replace(/^http:\/\//, 'https://')}
            alt={subcategory.name}
            className="w-full h-full object-cover"
            aspectRatio="square"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${subcategory.color || 'bg-primary/10'}`}>
            <IconComponent size={20} className="text-primary" />
          </div>
        )}
      </div>
      <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        {subcategory.name}
      </span>
      <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
  );
};

interface CategoryCardProps {
  category: CategoryWithHierarchy;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigateToCategory: () => void;
  onNavigateToSubcategory: (subcategory: SubcategoryWithIcon) => void;
}

const CategoryCard = ({
  category,
  isExpanded,
  onToggle,
  onNavigateToCategory,
  onNavigateToSubcategory
}: CategoryCardProps) => {
  const IconComponent = category.icon || LucideIcons.ShoppingBag;
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      {/* Category Header */}
      <div
        onClick={hasSubcategories ? onToggle : onNavigateToCategory}
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-all duration-200"
      >
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
          <IconComponent size={28} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-base truncate">{category.name}</h3>
          {hasSubcategories && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {category.subcategories.length} subcategor{category.subcategories.length === 1 ? 'y' : 'ies'}
            </p>
          )}
        </div>
        {hasSubcategories ? (
          <div className={`p-2 rounded-full bg-muted/50 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={18} className="text-muted-foreground" />
          </div>
        ) : (
          <ChevronRight size={20} className="text-muted-foreground" />
        )}
      </div>

      {/* Subcategories */}
      {hasSubcategories && isExpanded && (
        <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {/* View All Link */}
          <div
            onClick={onNavigateToCategory}
            className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl hover:bg-primary/10 transition-all duration-200 cursor-pointer group border border-primary/10"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Grid3X3 size={20} className="text-primary" />
            </div>
            <span className="flex-1 text-sm font-medium text-primary">
              View All {category.name}
            </span>
            <ChevronRight size={16} className="text-primary" />
          </div>

          {/* Subcategory Items */}
          {category.subcategories.map((subcategory) => (
            <SubcategoryItem
              key={subcategory.id}
              subcategory={subcategory}
              parentCategory={category}
              onNavigate={() => onNavigateToSubcategory(subcategory)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MobileCategoryPage = () => {
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const { data: categories, isLoading, error } = useCategoryHierarchy();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const navigateToCategory = (category: CategoryWithHierarchy) => {
    const url = generateCategoryUrl(category.name, category.id, category.slug);
    navigate(url);
  };

  const navigateToSubcategory = (category: CategoryWithHierarchy, subcategory: SubcategoryWithIcon) => {
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

  // Filter categories based on search
  const filteredCategories = categories?.filter(category => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const categoryMatch = category.name.toLowerCase().includes(query);
    const subcategoryMatch = category.subcategories?.some(sub =>
      sub.name.toLowerCase().includes(query)
    );
    return categoryMatch || subcategoryMatch;
  }) || [];

  return (
    <>
      <SEOHelmet
        title="Browse Categories - SmartKenya"
        description="Explore our wide range of product categories including electronics, fashion, home appliances and more at SmartKenya."
        keywords="categories, electronics, fashion, home appliances, Kenya shopping"
        canonical="https://www.smartkenya.co.ke/category"
      />

      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        <main className="flex-grow pb-20">
          {/* Breadcrumb - Desktop Only */}
          {!isMobile && (
            <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-6">
              <SiteBreadcrumb
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Categories' }
                ]}
                className="mb-6"
              />
            </div>
          )}

          {/* Page Header */}
          <div className={`${isMobile ? 'px-4 pt-4 pb-3' : 'max-w-[1200px] mx-auto px-4 lg:px-6 mb-6'}`}>
            {isMobile ? (
              <div className="space-y-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground">Categories</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Browse all product categories</p>
                </div>
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-muted/30 border-border/50 rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">All Categories</h1>
                <p className="text-muted-foreground mt-1">Browse products by category</p>
              </>
            )}
          </div>

          {/* Category List */}
          <div className={isMobile ? 'px-4 space-y-3' : 'max-w-[1200px] mx-auto px-4 lg:px-6'}>
            {isLoading ? (
              <CategorySkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-destructive mb-2">Failed to load categories</div>
                <p className="text-sm text-muted-foreground">Please try again later</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search size={48} className="text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No categories found</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : isMobile ? (
              // Mobile - Accordion Style
              <div className="space-y-3 pb-4">
                {filteredCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    isExpanded={expandedCategories.has(category.id)}
                    onToggle={() => toggleCategory(category.id)}
                    onNavigateToCategory={() => navigateToCategory(category)}
                    onNavigateToSubcategory={(sub) => navigateToSubcategory(category, sub)}
                  />
                ))}
              </div>
            ) : (
              // Desktop - Keep existing grid style
              <section className="bg-card rounded-xl border border-border/50 shadow-sm">
                <h2 className="px-6 py-4 text-lg font-semibold text-foreground border-b border-border/50">
                  Shop by Category
                </h2>
                <div className="grid grid-cols-4 lg:grid-cols-6 gap-4 p-6">
                  {filteredCategories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <div
                        key={category.id}
                        onClick={() => navigateToCategory(category)}
                        className="flex flex-col items-center justify-center cursor-pointer group p-4 rounded-xl hover:bg-muted/50 transition-all duration-200"
                      >
                        <div className="relative w-20 h-20 mb-3 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                          <IconComponent size={36} className="text-primary" />
                        </div>
                        <span className="text-sm text-foreground text-center font-medium group-hover:text-primary transition-colors line-clamp-2">
                          {category.name}
                        </span>
                        {category.subcategories?.length > 0 && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {category.subcategories.length} items
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default MobileCategoryPage;