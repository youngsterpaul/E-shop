
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CategoryFilter from './CategoryFilter';
import SubcategoryFilter from './SubcategoryFilter';
import BrandFilter from './BrandFilter';
import PriceFilter from './PriceFilter';
import RatingFilter from './RatingFilter';
import SpecificationFilter from './SpecificationFilter';
import { useCategories } from '@/hooks/useCategories';

interface ProductFiltersProps {
  selectedCategories: string[];
  selectedSubcategories: string[];
  selectedBrands: string[];
  selectedRatings: number[];
  priceRange: [number, number];
  onToggleCategory: (category: string) => void;
  onToggleSubcategory: (subcategory: string) => void;
  onToggleBrand: (brand: string) => void;
  onToggleRating: (rating: number) => void;
  onPriceChange: (range: [number, number]) => void;
  onResetFilters: () => void;
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
}: ProductFiltersProps) => {
  const { categories } = useCategories();

  const hasActiveFilters = 
    selectedCategories.length > 0 ||
    selectedSubcategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedRatings.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 100000;

  return (
    <div className="space-y-6">
      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onResetFilters}
          className="w-full"
        >
          Clear All Filters
        </Button>
      )}

      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-4 text-gray-900">Categories</h3>
        <CategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={onToggleCategory}
        />
      </div>

      <Separator />

      {/* Subcategories */}
      {selectedCategories.length > 0 && (
        <>
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">Subcategories</h3>
            <SubcategoryFilter
              selectedCategories={selectedCategories}
              selectedSubcategories={selectedSubcategories}
              onToggleSubcategory={onToggleSubcategory}
            />
          </div>
          <Separator />
        </>
      )}

      {/* Brands */}
      <div>
        <h3 className="font-semibold mb-4 text-gray-900">Brands</h3>
        <BrandFilter
          selectedBrands={selectedBrands}
          onToggleBrand={onToggleBrand}
          selectedCategories={selectedCategories}
          selectedSubcategories={selectedSubcategories}
        />
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <PriceFilter
          priceRange={priceRange}
          onPriceChange={onPriceChange}
        />
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <RatingFilter
          selectedRatings={selectedRatings}
          onToggleRating={onToggleRating}
        />
      </div>

      <Separator />

      {/* Specifications */}
      <div>
        <h3 className="font-semibold mb-4 text-gray-900">Specifications</h3>
        <SpecificationFilter
          selectedCategories={selectedCategories}
          selectedSubcategories={selectedSubcategories}
        />
      </div>
    </div>
  );
};

export default ProductFilters;
