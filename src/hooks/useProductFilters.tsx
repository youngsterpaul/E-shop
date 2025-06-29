
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UseProductFiltersProps {
  onFiltersChange?: (filters: ProductFilters) => void;
  debounceMs?: number;
}

interface ProductFilters {
  selectedCategories: string[];
  selectedSubcategories: string[];
  selectedBrands: string[];
  selectedRatings: number[];
  priceRange: [number, number];
  sortOption: string;
}

export const useProductFilters = ({ 
  onFiltersChange, 
  debounceMs = 300 
}: UseProductFiltersProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortOption, setSortOption] = useState("featured");

  // Initialize filters from URL
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
    
    const sortParam = searchParams.get("sort");
    if (sortParam) {
      setSortOption(sortParam);
    }
  }, [searchParams]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (selectedCategories.length === 1) {
        params.set("category", selectedCategories[0]);
      }
      
      if (sortOption !== "featured") {
        params.set("sort", sortOption);
      }
      
      setSearchParams(params);
    }, debounceMs);

    // Call filters change callback
    if (onFiltersChange) {
      onFiltersChange({
        selectedCategories,
        selectedSubcategories,
        selectedBrands,
        selectedRatings,
        priceRange,
        sortOption,
      });
    }

    return () => clearTimeout(timeoutId);
  }, [selectedCategories, selectedSubcategories, selectedBrands, selectedRatings, priceRange, sortOption, onFiltersChange, debounceMs, setSearchParams]);

  // Filter handlers
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [category] // Only allow one category at a time
    );
  }, []);

  const toggleSubcategory = useCallback((subcategory: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategory) 
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory]
    );
  }, []);

  const toggleBrand = useCallback((brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  }, []);

  const toggleRating = useCallback((rating: number) => {
    setSelectedRatings(prev => 
      prev.includes(rating) 
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedBrands([]);
    setPriceRange([0, 100000]);
    setSelectedRatings([]);
    setSortOption("featured");
    setSearchParams({});
  }, [setSearchParams]);

  return {
    // Filter state
    selectedCategories,
    selectedSubcategories,
    selectedBrands,
    selectedRatings,
    priceRange,
    sortOption,
    
    // Filter handlers
    toggleCategory,
    toggleSubcategory,
    toggleBrand,
    toggleRating,
    setPriceRange,
    setSortOption,
    resetFilters,
  };
};
