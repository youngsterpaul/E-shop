
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import CategoryFilter from './CategoryFilter';
import BrandFilter from './BrandFilter';
import PriceFilter from './PriceFilter';
import RatingFilter from './RatingFilter';
import SubcategoryFilter from './SubcategoryFilter';

interface ProductFiltersProps {
  // Filter states
  selectedCategories: string[];
  selectedSubcategories: string[];
  selectedBrands: string[];
  selectedRatings: number[];
  priceRange: [number, number];
  
  // Filter handlers
  onToggleCategory: (category: string) => void;
  onToggleSubcategory: (subcategory: string) => void;
  onToggleBrand: (brand: string) => void;
  onToggleRating: (rating: number) => void;
  onPriceChange: (range: [number, number]) => void;
  onResetFilters: () => void;
  
  // Data - simplified interfaces
  categories: Array<{ id: string; name: string; }>;
  subcategories: Array<{ id: string; name: string; }>;
  
  // UI state
  isMobile?: boolean;
  openSections?: string[];
  onToggleSection?: (section: string) => void;
}

const ProductFilters = ({
  selectedCategories,
  selectedSubcategories,
  selectedBrands,
  selectedRatings,
  priceRange,
  onToggleCategory,
  onToggleSubcategory,
  onToggleBrand,
  onToggleRating,
  onPriceChange,
  onResetFilters,
  categories,
  subcategories,
  isMobile = false,
  openSections = [],
  onToggleSection
}: ProductFiltersProps) => {
  const hasActiveFilters = 
    selectedCategories.length > 0 ||
    selectedSubcategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedRatings.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 100000;

  const FilterSection = ({ 
    title, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    sectionKey: string; 
    children: React.ReactNode 
  }) => {
    const isOpen = openSections.includes(sectionKey);
    
    if (isMobile && onToggleSection) {
      return (
        <div>
          <Button
            variant="ghost"
            className="flex w-full justify-between px-0"
            onClick={() => onToggleSection(sectionKey)}
          >
            <span className="font-medium">{title}</span>
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
          {isOpen && <div className="mt-2">{children}</div>}
        </div>
      );
    }
    
    return (
      <div>
        <h3 className="font-medium mb-4">{title}</h3>
        {children}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategories.map((category) => (
            <Badge key={category} variant="outline" className="pl-2 flex items-center gap-1">
              {category}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onToggleCategory(category)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {selectedSubcategories.map((subcategory) => (
            <Badge key={subcategory} variant="outline" className="pl-2 flex items-center gap-1">
              {subcategory}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onToggleSubcategory(subcategory)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {selectedBrands.map((brand) => (
            <Badge key={brand} variant="outline" className="pl-2 flex items-center gap-1">
              {brand}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onToggleBrand(brand)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {selectedRatings.map((rating) => (
            <Badge key={rating} variant="outline" className="pl-2 flex items-center gap-1">
              {rating}★ & Up
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onToggleRating(rating)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {(priceRange[0] > 0 || priceRange[1] < 100000) && (
            <Badge variant="outline" className="pl-2 flex items-center gap-1">
              Ksh {priceRange[0].toLocaleString()} - Ksh {priceRange[1].toLocaleString()}
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="text-sm hover:bg-transparent hover:text-orange-600"
            onClick={onResetFilters}
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Filter Sections */}
      <FilterSection title="Categories" sectionKey="categories">
        <CategoryFilter 
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={onToggleCategory}
        />
      </FilterSection>

      {subcategories.length > 0 && (
        <FilterSection title="Subcategories" sectionKey="subcategories">
          <SubcategoryFilter 
            subcategories={subcategories}
            selectedSubcategories={selectedSubcategories}
            onToggleSubcategory={onToggleSubcategory}
            selectedCategories={selectedCategories}
          />
        </FilterSection>
      )}

      <FilterSection title="Price Range" sectionKey="price">
        <PriceFilter 
          priceRange={priceRange}
          onPriceChange={onPriceChange}
        />
      </FilterSection>

      <FilterSection title="Brand" sectionKey="brand">
        <BrandFilter 
          selectedBrands={selectedBrands}
          onToggleBrand={onToggleBrand}
          selectedCategories={selectedCategories}
          selectedSubcategories={selectedSubcategories}
        />
      </FilterSection>

      <FilterSection title="Rating" sectionKey="rating">
        <RatingFilter 
          selectedRatings={selectedRatings}
          onToggleRating={onToggleRating}
        />
      </FilterSection>
    </div>
  );
};

export default ProductFilters;
