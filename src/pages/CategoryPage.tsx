
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import Header from '@/components/Header';
import ProductGrid from '@/components/products/ProductGrid';
import PriceFilter from '@/components/products/PriceFilter';
import RatingFilter from '@/components/products/RatingFilter';
import BrandFilter from '@/components/products/BrandFilter';
import SubcategoryFilter from '@/components/products/SubcategoryFilter';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Button } from '@/components/ui/button';
import { Filter, SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryId ? [categoryId] : []);
  
  const { categories } = useCategories();
  const category = categories?.find(cat => cat.id === categoryId);
  
  const { fetchProductsByCategory } = useProducts();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      if (!categoryId) return;
      
      setLoading(true);
      try {
        const fetchedProducts = await fetchProductsByCategory(categoryId);
        setProducts(fetchedProducts || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, fetchProductsByCategory]);

  const handleToggleRating = (rating: number) => {
    setSelectedRatings(prev => 
      prev.includes(rating) 
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  const handleToggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleToggleSubcategory = (subcategory: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategory) 
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory]
    );
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <PriceFilter
        priceRange={priceRange}
        onPriceChange={setPriceRange}
      />
      <div>
        <h3 className="font-medium mb-4">Rating</h3>
        <RatingFilter
          selectedRatings={selectedRatings}
          onToggleRating={handleToggleRating}
        />
      </div>
      <div>
        <h3 className="font-medium mb-4">Brands</h3>
        <BrandFilter
          selectedBrands={selectedBrands}
          onToggleBrand={handleToggleBrand}
          selectedCategories={selectedCategories}
          selectedSubcategories={selectedSubcategories}
        />
      </div>
      <div>
        <h3 className="font-medium mb-4">Subcategories</h3>
        <SubcategoryFilter
          subcategories={category?.subcategories || []}
          selectedSubcategories={selectedSubcategories}
          onToggleSubcategory={handleToggleSubcategory}
          selectedCategories={selectedCategories}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {!isMobile && <Header />}
      <MobileHeader 
        title={category?.name || 'Category'}
        backTo="/products"
        rightAction={
          isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <SlidersHorizontal className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          ) : undefined
        }
      />
      
      <div className="container mx-auto px-4 py-6">
        {!isMobile && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {category?.name || 'Category'}
            </h1>
            <p className="text-gray-600 mt-2">
              {category?.description || 'Explore our products in this category'}
            </p>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          {!isMobile && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h3>
                <FilterContent />
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            <ProductGrid 
              products={products} 
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

