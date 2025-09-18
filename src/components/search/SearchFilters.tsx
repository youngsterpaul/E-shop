import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Product } from '@/hooks/useProducts';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface SearchFiltersProps {
  products: Product[];
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export interface FilterState {
  priceRange: [number, number];
  specifications: Record<string, string[]>;
  ratings: number[];
}

const SearchFilters = ({ products, onFiltersChange, className }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 200000],
    specifications: {},
    ratings: [],
  });

  const isMobile = isMobileUserAgent();

  const [openSections, setOpenSections] = useState({
    price: true,
    specs: true,
    rating: true,
  });

  // Extract filter options from products
  const filterOptions = useMemo(() => {
    if (!products?.length) return { specs: {}, maxPrice: 200000 };

    const specs: Record<string, Set<string>> = {};
    let maxPrice = 0;

    products.forEach(product => {
      // Extract price
      if (product.price && product.price > maxPrice) {
        maxPrice = product.price;
      }

      // Extract specs from specification field only
      if (product.specification && typeof product.specification === 'object') {
        Object.entries(product.specification).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            if (!specs[key]) specs[key] = new Set();
            specs[key].add(value);
          }
        });
      }
    });

    // Convert sets to sorted arrays
    const sortedSpecs: Record<string, string[]> = {};
    Object.entries(specs).forEach(([key, valueSet]) => {
      sortedSpecs[key] = Array.from(valueSet).sort();
    });

    return {
      specs: sortedSpecs,
      maxPrice: Math.ceil(maxPrice * 1.1), // Add 10% buffer
    };
  }, [products]);

  // Initialize price range based on products
  useEffect(() => {
    if (filterOptions.maxPrice > 0) {
      setFilters(prev => ({
        ...prev,
        priceRange: [0, filterOptions.maxPrice],
      }));
    }
  }, [filterOptions.maxPrice]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePriceChange = (newRange: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [newRange[0], newRange[1]],
    }));
  };

  const toggleSpec = (specType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [specType]: prev.specifications[specType]?.includes(value)
          ? prev.specifications[specType].filter(v => v !== value)
          : [...(prev.specifications[specType] || []), value],
      },
    }));
  };

  const toggleRating = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      ratings: prev.ratings.includes(rating)
        ? prev.ratings.filter(r => r !== rating)
        : [...prev.ratings, rating],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: [0, filterOptions.maxPrice],
      specifications: {},
      ratings: [],
    });
  };

  const activeFiltersCount = 
    Object.values(filters.specifications).flat().length +
    filters.ratings.length + 
    (filters.priceRange[0] > 0 || filters.priceRange[1] < filterOptions.maxPrice ? 1 : 0);

  return (
    <div className={`bg-white border border-gray-200 ${isMobile ? 'rounded-lg':''} ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="max-h-[1000px]">
        <div className="p-4 space-y-6">
          {/* Price Range Filter */}
          <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-0">
              <h4 className="font-medium text-gray-900">Price</h4>
              {openSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceChange}
                min={0}
                max={filterOptions.maxPrice}
                step={1000}
                className="py-2"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange([Number(e.target.value), filters.priceRange[1]])}
                  className="h-8"
                  placeholder="Min"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange([filters.priceRange[0], Number(e.target.value)])}
                  className="h-8"
                  placeholder="Max"
                />
              </div>
              <div className="text-xs text-gray-500">
                KES {filters.priceRange[0].toLocaleString()} - KES {filters.priceRange[1].toLocaleString()}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Specifications Filters */}
          {Object.keys(filterOptions.specs).map((specType) => (
            <div key={specType}>
              <Collapsible 
                open={openSections.specs} 
                onOpenChange={() => toggleSection('specs')}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between p-0">
                  <h4 className="font-medium text-gray-900">{specType}</h4>
                  {openSections.specs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {filterOptions.specs[specType].map((value) => (
                    <div key={`${specType}-${value}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`spec-${specType}-${value}`}
                        checked={filters.specifications[specType]?.includes(value) || false}
                        onCheckedChange={() => toggleSpec(specType, value)}
                      />
                      <label
                        htmlFor={`spec-${specType}-${value}`}
                        className="text-sm text-gray-700 cursor-pointer flex-1"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </div>
          ))}

          {/* Rating Filter */}
          <Collapsible open={openSections.rating} onOpenChange={() => toggleSection('rating')}>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-0">
              <h4 className="font-medium text-gray-900">Rating</h4>
              {openSections.rating ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={filters.ratings.includes(rating)}
                    onCheckedChange={() => toggleRating(rating)}
                  />
                  <label
                    htmlFor={`rating-${rating}`}
                    className="text-sm text-gray-700 cursor-pointer flex-1"
                  >
                    {rating}★ & Up
                  </label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SearchFilters;
