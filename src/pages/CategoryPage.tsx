import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { FilterState } from '@/components/search/SearchFilters';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductList } from '@/components/products/ProductList';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useUrlSync } from '@/hooks/useUrlSync';
import { supabase } from '@/integrations/supabase/client';
import { getSpecConfig } from '@/utils/specConfig';

interface Category {
  id: number;
  category: string;
  slug: string | null;
  parent_id: number | null;
}

const CategoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(36);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 200000],
    specifications: {},
    ratings: [],
  });

  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [parentCategoryData, setParentCategoryData] = useState<Category | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  const { fetchProductsByCategoryId, searchProducts } = useProducts();

  const searchParams = new URLSearchParams(location.search);
  const categoryId = searchParams.get('id');
  const parentId = searchParams.get('parent');
  const source = searchParams.get('source');

  const sourceParts = useMemo(
    () => (source ? source.split('|').slice(1).map((p) => decodeURIComponent(p)) : []),
    [source]
  );
  const fallbackCategoryName = sourceParts[sourceParts.length - 1];
  const fallbackParentName =
    sourceParts.length > 1 && sourceParts[0] !== 'allCategory' ? sourceParts[0] : undefined;

  useUrlSync(
    { searchQuery, sortOption, currentPage, itemsPerPage },
    { setSearchQuery, setSortOption, setCurrentPage, setItemsPerPage },
    { preserveParams: ['id', 'parent', 'source', 'form'] }
  );

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!categoryId) return;
      try {
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', Number(categoryId))
          .single();

        if (categoryError) throw categoryError;
        setCategoryData(category);

        if (parentId) {
          const { data: parentCategory, error: parentError } = await supabase
            .from('categories')
            .select('*')
            .eq('id', Number(parentId))
            .single();
          if (!parentError) setParentCategoryData(parentCategory);
        }

        if (source) {
          const parts = source.split('|');
          setBreadcrumbs(parts.slice(1));
        }
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    };
    fetchCategoryData();
  }, [categoryId, parentId, source]);

  const useGlobalSearch = searchQuery.length > 0;

  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: [
      useGlobalSearch ? 'globalSearch' : 'categoryProducts',
      searchQuery,
      categoryId,
      fallbackCategoryName,
      currentPage,
      itemsPerPage,
    ],
    queryFn: () => {
      if (useGlobalSearch) {
        return searchProducts(searchQuery, {
          pageParam: currentPage - 1,
          pageSize: itemsPerPage,
        });
      }
      return fetchProductsByCategoryId(
        Number(categoryId),
        { pageParam: currentPage - 1, pageSize: itemsPerPage },
        { categoryName: fallbackCategoryName, parentName: fallbackParentName }
      );
    },
    enabled: useGlobalSearch ? searchQuery.length > 1 : !!(categoryId || fallbackCategoryName),
    staleTime: 30000,
  });

  const allProducts = useMemo(() => productsData?.products || [], [productsData]);
  const totalCount = productsData?.totalCount || allProducts.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Derive spec config from the current category slug
  const specConfig = useMemo(() => getSpecConfig(categoryData?.slug), [categoryData?.slug]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!isMobile) setCurrentPage(1);
  }, [isMobile]);

  const handleSortChange = useCallback((val: string) => setSortOption(val), []);
  const handlePageChange = useCallback((p: number) => setCurrentPage(p), []);
  const handlePageSizeChange = useCallback((size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  }, []);
  const handleFiltersChange = useCallback((newFilters: FilterState) => setFilters(newFilters), []);
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    setFilters({ priceRange: [0, 200000], specifications: {}, ratings: [] });
  }, [searchQuery, categoryId]);

  const handleBreadcrumbClick = useCallback(
    (index: number) => {
      if (index === 0) {
        navigate('/');
      } else if (index === 1 && parentCategoryData) {
        navigate(
          `/category/${parentCategoryData.slug}?id=${parentCategoryData.id}&form=category&source=category|allCategory|${encodeURIComponent(parentCategoryData.category)}`
        );
      }
    },
    [navigate, parentCategoryData]
  );

  const emptyStateAction = useMemo(
    () => (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {searchQuery && (
          <Button onClick={() => setSearchQuery('')} variant="outline" className="rounded-xl">
            Clear Search
          </Button>
        )}
        <Button onClick={() => navigate('/')} variant="outline" className="rounded-xl">
          Browse All Categories
        </Button>
      </div>
    ),
    [searchQuery, navigate]
  );

  const emptyStateMessage = searchQuery
    ? `No products found for "${searchQuery}"${useGlobalSearch ? '' : ' in this category'}.`
    : 'No products found in this category.';

  return (
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max min-w-[1200px]' : ''}`}>
      <PageHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        onBack={handleBack}
        placeholder={useGlobalSearch ? 'Search all products...' : 'Search in this category...'}
      />

      <main className={`flex-grow ${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6 pb-8 mt-6' : 'px-0'}`}>
        <Breadcrumbs items={breadcrumbs} onItemClick={handleBreadcrumbClick} />

        {useGlobalSearch && !isMobile && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 flex items-center justify-between">
            <p className="text-foreground text-sm">
              Searching across all products.{' '}
              <button
                onClick={() => setSearchQuery('')}
                className="underline font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Clear search
              </button>{' '}
              to view category products only.
            </p>
          </div>
        )}

        <ProductList
          products={allProducts}
          isLoading={isLoading}
          isError={isError}
          sortOption={sortOption}
          onSortChange={handleSortChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          searchQuery={useGlobalSearch ? '' : searchQuery}
          emptyStateMessage={emptyStateMessage}
          emptyStateAction={emptyStateAction}
          specConfig={specConfig}
        />
      </main>
    </div>
  );
};

export default CategoryPage;