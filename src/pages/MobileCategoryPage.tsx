import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Search, Grid3X3, Sparkles, ArrowRight } from 'lucide-react';
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
  <div className="space-y-2 px-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl">
        <Skeleton className="w-11 h-11 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="w-4 h-4" />
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
      className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer group"
    >
      <div className="relative w-9 h-9 rounded-md overflow-hidden bg-muted/40 flex-shrink-0">
        {subcategory.productImage ? (
          <OptimizedImage
            src={subcategory.productImage.replace(/^http:\/\//, 'https://')}
            alt={subcategory.name}
            className="w-full h-full object-cover"
            aspectRatio="square"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${subcategory.color || 'bg-primary/10'}`}>
            <IconComponent size={16} className="text-primary" />
          </div>
        )}
      </div>
      <span className="flex-1 text-[13px] font-medium text-foreground/80 group-hover:text-primary transition-colors">
        {subcategory.name}
      </span>
      <ChevronRight size={14} className="text-muted-foreground/50" />
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
    <div className={`rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'bg-card border border-border/60 shadow-sm' : ''}`}>
      {/* Category Header */}
      <div
        onClick={hasSubcategories ? onToggle : onNavigateToCategory}
        className={`flex items-center gap-3 p-3 cursor-pointer active:bg-muted/40 transition-colors ${!isExpanded ? 'hover:bg-muted/30' : ''}`}
      >
        <div className="w-11 h-11 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
          <IconComponent size={22} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-[14px] truncate">{category.name}</h3>
          {hasSubcategories && (
            <p className="text-[11px] text-muted-foreground">
              {category.subcategories.length} subcategor{category.subcategories.length === 1 ? 'y' : 'ies'}
            </p>
          )}
        </div>
        {hasSubcategories ? (
          <ChevronDown 
            size={16} 
            className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
          />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground/50" />
        )}
      </div>

      {/* Subcategories */}
      {hasSubcategories && isExpanded && (
        <div className="px-3 pb-3 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* View All */}
          <div
            onClick={onNavigateToCategory}
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg bg-primary/5 hover:bg-primary/10 active:bg-primary/15 transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Grid3X3 size={16} className="text-primary" />
            </div>
            <span className="flex-1 text-[13px] font-semibold text-primary">
              All {category.name}
            </span>
            <ChevronRight size={14} className="text-primary/60" />
          </div>

          {/* Divider */}
          <div className="h-px bg-border/40 mx-3 my-1" />

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
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

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
  const filteredCategories = useMemo(() => {
    return categories?.filter(category => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const categoryMatch = category.name.toLowerCase().includes(query);
      const subcategoryMatch = category.subcategories?.some(sub =>
        sub.name.toLowerCase().includes(query)
      );
      return categoryMatch || subcategoryMatch;
    }) || [];
  }, [categories, searchQuery]);

  // Keep an active category selected for the right pane
  useEffect(() => {
    if (filteredCategories.length === 0) {
      setActiveCategoryId(null);
      return;
    }
    if (activeCategoryId === null || !filteredCategories.some(c => c.id === activeCategoryId)) {
      setActiveCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, activeCategoryId]);

  const activeCategory = filteredCategories.find(c => c.id === activeCategoryId) || null;

  // For search: filter subcategories shown in the right pane
  const visibleSubcategories = useMemo(() => {
    if (!activeCategory) return [];
    if (!searchQuery) return activeCategory.subcategories || [];
    const q = searchQuery.toLowerCase();
    const matchingSubs = (activeCategory.subcategories || []).filter(s =>
      s.name.toLowerCase().includes(q)
    );
    // If parent matched but no subs match, show all subs
    return matchingSubs.length > 0 ? matchingSubs : (activeCategory.subcategories || []);
  }, [activeCategory, searchQuery]);

  return (
    <>
      <SEOHelmet
        title="Browse Categories - SmartKenya"
        description="Explore our wide range of product categories including electronics, fashion, home appliances and more at SmartKenya."
        keywords="categories, electronics, fashion, home appliances, Kenya shopping"
        canonical="https://www.smartkenya.co.ke/category"
      />

      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        <main className={`flex-grow ${isMobile ? '' : 'pb-20'}`}>
          {/* Breadcrumb - Desktop Only */}
          {!isMobile && (
            <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pt-6">
              <SiteBreadcrumb
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Categories' }
                ]}
                className="mb-6"
              />
            </div>
          )}

          {/* Desktop Header */}
          {!isMobile && (
            <div className="max-w-[1400px] mx-auto px-4 lg:px-6 mb-6">
              <h1 className="text-2xl font-bold text-foreground">All Categories</h1>
              <p className="text-muted-foreground mt-1">Browse products by category</p>
            </div>
          )}

          {/* Category List */}
          <div className={isMobile ? '' : 'max-w-[1400px] mx-auto px-4 lg:px-6'}>
            {isLoading ? (
              <div className={isMobile ? 'px-3' : ''}>
                <CategorySkeleton />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-destructive text-sm mb-1">Failed to load categories</div>
                <p className="text-xs text-muted-foreground">Please try again later</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search size={36} className="text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No categories found</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs text-primary font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : isMobile ? (
              /* Mobile - Two-pane drill-down with independent scroll */
              <div
                className="flex border-t border-border/40 overflow-hidden"
                style={{ height: 'calc(100vh - 120px)' }}
              >
                {/* Left rail: categories (independently scrollable) */}
                <nav className="w-[96px] shrink-0 bg-muted/20 border-r border-border/40 overflow-y-auto overscroll-contain py-2 scrollbar-thin">
                  {filteredCategories.map((category) => {
                    const IconComponent = category.icon || LucideIcons.ShoppingBag;
                    const isActive = category.id === activeCategoryId;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategoryId(category.id)}
                        className={`w-full px-1.5 py-2 mx-1 my-0.5 rounded-lg flex flex-col items-center gap-1 relative transition-colors ${
                          isActive
                            ? 'bg-card ring-1 ring-primary/20 shadow-sm'
                            : 'hover:bg-muted/40'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                        )}
                        <div className={`size-9 rounded-lg overflow-hidden flex items-center justify-center ring-1 ${
                          isActive ? 'ring-primary/20 bg-primary/8' : 'ring-border/50 bg-muted/40'
                        }`}>
                          <IconComponent
                            size={18}
                            className={isActive ? 'text-primary' : 'text-muted-foreground'}
                          />
                        </div>
                        <span className={`text-[10.5px] leading-tight text-center line-clamp-2 ${
                          isActive ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                        }`}>
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </nav>

                {/* Right pane: subcategory grid (independently scrollable) */}
                <section className="flex-1 overflow-y-auto overscroll-contain px-2.5 pt-2.5 pb-8">
                  {activeCategory && (
                    <>
                      <div className="flex items-baseline justify-between mb-2.5 px-1">
                        <h2 className="text-[14px] font-bold text-foreground tracking-tight truncate">
                          {activeCategory.name}
                        </h2>
                        <button
                          onClick={() => navigateToCategory(activeCategory)}
                          className="flex items-center gap-1 text-[10.5px] font-semibold text-primary uppercase tracking-wider shrink-0"
                        >
                          View all <ArrowRight size={10} />
                        </button>
                      </div>

                      {visibleSubcategories.length === 0 ? (
                        <button
                          onClick={() => navigateToCategory(activeCategory)}
                          className="w-full bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col items-center gap-2 active:bg-primary/10"
                        >
                          <Grid3X3 size={20} className="text-primary" />
                          <span className="text-[12px] font-semibold text-primary">
                            Browse all {activeCategory.name}
                          </span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {visibleSubcategories.map((sub) => {
                            const SubIcon =
                              (LucideIcons as any)[sub.iconName || 'Tag'] || LucideIcons.Tag;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => navigateToSubcategory(activeCategory, sub)}
                                className="group bg-card border border-border/50 rounded-xl overflow-hidden text-left active:bg-muted/40 transition-colors"
                              >
                                <div className="aspect-square bg-muted/30 overflow-hidden relative">
                                  {sub.productImage ? (
                                    <OptimizedImage
                                      src={sub.productImage.replace(/^http:\/\//, 'https://')}
                                      alt={sub.name}
                                      className="w-full h-full object-cover"
                                      aspectRatio="square"
                                    />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${sub.color || 'bg-primary/10'}`}>
                                      <SubIcon size={18} className="text-primary" />
                                    </div>
                                  )}
                                </div>
                                <div className="px-1.5 py-1.5">
                                  <h3 className="text-[10.5px] font-medium text-foreground leading-tight line-clamp-2 text-center">
                                    {sub.name}
                                  </h3>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            ) : (
              /* Desktop - Grid */
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
