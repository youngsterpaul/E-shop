
import { Checkbox } from '@/components/ui/checkbox';
import { useBrands } from '@/hooks/useBrands';
import { useEffect } from 'react';

interface BrandFilterProps {
  selectedBrands: string[];
  onToggleBrand: (brand: string) => void;
  selectedCategories: string[];
  selectedSubcategories: string[];
}

const BrandFilter = ({ selectedBrands, onToggleBrand, selectedCategories, selectedSubcategories }: BrandFilterProps) => {
  const { brands, loading, fetchBrandsByCategory, fetchBrandsBySubcategory, fetchAllBrands } = useBrands();

  useEffect(() => {
    if (selectedSubcategories.length === 1) {
      // Fetch brands for the selected subcategory
      fetchBrandsBySubcategory(selectedSubcategories[0]);
    } else if (selectedSubcategories.length === 0 && selectedCategories.length === 1) {
      // Fetch brands for all subcategories of the selected category
      fetchBrandsByCategory(selectedCategories[0]);
    } else if (selectedCategories.length === 0 && selectedSubcategories.length === 0) {
      // Fetch all brands
      fetchAllBrands();
    } else {
      // Multiple categories/subcategories selected - show all brands
      fetchAllBrands();
    }
  }, [selectedCategories, selectedSubcategories]);

  if (loading || brands.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="font-medium mb-4">Brands</h3>
      <div className="space-y-2">
        {brands.map((brand) => (
          <div key={brand.id} className="flex items-center">
            <Checkbox
              id={`brand-${brand.id}`}
              checked={selectedBrands.includes(brand.name)}
              onCheckedChange={() => onToggleBrand(brand.name)}
            />
            <label
              htmlFor={`brand-${brand.id}`}
              className="ml-2 text-sm font-medium cursor-pointer"
            >
              {brand.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandFilter;
