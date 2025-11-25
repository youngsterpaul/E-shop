import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Product } from '@/hooks/useProducts';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface SearchFiltersProps {
  products: Product[];
  value?: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApply?: () => void;
  className?: string;
}

export interface FilterState {
  priceRange: [number, number];
  specifications: Record<string, string[]>;
  ratings: number[];
}

// Memoized filter option item
const FilterOption = memo(({ 
  id, 
  label, 
  checked, 
  onToggle 
}: { 
  id: string; 
  label: string; 
  checked: boolean; 
  onToggle: () => void;
}) => (
  <div className="flex items-center space-x-2">
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={onToggle}
    />
    <label
      htmlFor={id}
      className="text-sm text-gray-700 cursor-pointer flex-1 leading-none"
    >
      {label}
    </label>
  </div>
));

FilterOption.displayName = 'FilterOption';

const SearchFilters = ({ products, value, onFiltersChange, onApply, className }: SearchFiltersProps) => {
  const isMobile = isMobileUserAgent();

  // Local state for price (to allow user to type without triggering filters)
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(
    value?.priceRange || [0, 200000]
  );
  
  // Applied filters state
  const [filters, setFilters] = useState<FilterState>(
    value || {
      priceRange: [0, 200000],
      specifications: {},
      ratings: [],
    }
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    rating: true,
  });

  // Extract filter options with memoization
  const filterOptions = useMemo(() => {
    if (!products?.length) return { specs: {}, maxPrice: 200000 };

    const specs: Record<string, Set<string>> = {};
    let maxPrice = 0;

    products.forEach(product => {
      if (product.price && product.price > maxPrice) {
        maxPrice = product.price;
      }

      if (product.specification && typeof product.specification === 'object') {
        Object.entries(product.specification).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            if (!specs[key]) specs[key] = new Set();
            specs[key].add(value);
          }
        });
      }
    });

    const sortedSpecs: Record<string, string[]> = {};
    Object.entries(specs).forEach(([key, valueSet]) => {
      sortedSpecs[key] = Array.from(valueSet).sort();
    });

    return {
      specs: sortedSpecs,
      maxPrice: Math.ceil(maxPrice * 1.1),
    };
  }, [products]);

  // Sync with parent value prop when it changes
  useEffect(() => {
    if (value) {
      setFilters(value);
      setLocalPriceRange(value.priceRange);
    }
  }, [value]);

  // Initialize price range
  useEffect(() => {
    if (filterOptions.maxPrice > 0 && !value) {
      setLocalPriceRange([0, filterOptions.maxPrice]);
      setFilters(prev => ({
        ...prev,
        priceRange: [0, filterOptions.maxPrice],
      }));
    }
  }, [filterOptions.maxPrice, value]);

  // Auto-apply filters for desktop only (except price)
  useEffect(() => {
    if (!isMobile) {
      onFiltersChange(filters);
    }
  }, [filters.specifications, filters.ratings, isMobile]);

  const toggleSection = useCallback((section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handlePriceInputChange = useCallback((index: 0 | 1, value: string) => {
    const numValue = Number(value) || 0;
    setLocalPriceRange(prev => {
      const newRange: [number, number] = [...prev];
      newRange[index] = numValue;
      return newRange;
    });
  }, []);

  const applyPriceFilter = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      priceRange: localPriceRange,
    }));
    
    // For desktop, apply immediately
    if (!isMobile) {
      onFiltersChange({
        ...filters,
        priceRange: localPriceRange,
      });
    }
  }, [localPriceRange, filters, isMobile, onFiltersChange]);

  const toggleSpec = useCallback((specType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [specType]: prev.specifications[specType]?.includes(value)
          ? prev.specifications[specType].filter(v => v !== value)
          : [...(prev.specifications[specType] || []), value],
      },
    }));
  }, []);

  const toggleRating = useCallback((rating: number) => {
    setFilters(prev => ({
      ...prev,
      ratings: prev.ratings.includes(rating)
        ? prev.ratings.filter(r => r !== rating)
        : [...prev.ratings, rating],
    }));
  }, []);

  const resetFilters = useCallback(() => {
    const resetState = {
      priceRange: [0, filterOptions.maxPrice] as [number, number],
      specifications: {},
      ratings: [],
    };
    setLocalPriceRange(resetState.priceRange);
    setFilters(resetState);
    
    if (isMobile) {
      onFiltersChange(resetState);
      onApply?.();
    } else {
      onFiltersChange(resetState);
    }
  }, [filterOptions.maxPrice, isMobile, onFiltersChange, onApply]);

  const applyFilters = useCallback(() => {
    onFiltersChange(filters);
    onApply?.();
  }, [filters, onFiltersChange, onApply]);

  const activeFiltersCount = useMemo(() => 
    Object.values(filters.specifications).flat().length +
    filters.ratings.length + 
    (filters.priceRange[0] > 0 || filters.priceRange[1] < filterOptions.maxPrice ? 1 : 0),
    [filters, filterOptions.maxPrice]
  );

  return (
    <div className={`bg-white border border-gray-200 flex flex-col ${isMobile ? 'rounded-lg h-full' : ''} ${className}`}>
      <ScrollArea className={`flex-1 ${isMobile ? 'max-h-[calc(100vh-150px)]' : 'h-[calc(100vh-280px)]'}`}>
        <div className="p-4 space-y-4 pr-4">
          {/* Price Range Filter */}
          <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-0">
              <h4 className="font-medium text-gray-900">Price</h4>
              {openSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localPriceRange[0]}
                  onChange={(e) => handlePriceInputChange(0, e.target.value)}
                  className="h-8"
                  placeholder="Min"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  value={localPriceRange[1]}
                  onChange={(e) => handlePriceInputChange(1, e.target.value)}
                  className="h-8"
                  placeholder="Max"
                />
              </div>
              <div className="text-xs text-gray-500">
                KES {localPriceRange[0].toLocaleString()} - KES {localPriceRange[1].toLocaleString()}
              </div>
              {!isMobile && (
                <Button 
                  onClick={applyPriceFilter} 
                  className="w-full h-8 text-sm"
                  size="sm"
                >
                  Apply
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Specifications Filters */}
          {Object.entries(filterOptions.specs).map(([specType, values]) => {
            const isSpecOpen = openSections[`spec_${specType}`] ?? true;
            return (
              <div key={specType}>
                <Collapsible 
                  open={isSpecOpen} 
                  onOpenChange={() => toggleSection(`spec_${specType}`)}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-0">
                    <h4 className="font-medium text-gray-900 capitalize">{specType}</h4>
                    {isSpecOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-2">
                    {values.map((value) => (
                      <FilterOption
                        key={`${specType}-${value}`}
                        id={`spec-${specType}-${value}`}
                        label={value}
                        checked={filters.specifications[specType]?.includes(value) || false}
                        onToggle={() => toggleSpec(specType, value)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
                <Separator className="my-4" />
              </div>
            );
          })}

          {/* Rating Filter */}
          <Collapsible open={openSections.rating} onOpenChange={() => toggleSection('rating')}>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-0">
              <h4 className="font-medium text-gray-900">Rating</h4>
              {openSections.rating ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <FilterOption
                  key={rating}
                  id={`rating-${rating}`}
                  label={`${rating}★ & Up`}
                  checked={filters.ratings.includes(rating)}
                  onToggle={() => toggleRating(rating)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Mobile Bottom Actions */}
      {isMobile && (
        <div className="mt-auto border-t border-gray-200 p-3 bg-white sticky bottom-0">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex-1 h-10"
            >
              Reset
            </Button>
            <Button
              onClick={applyFilters}
              className="flex-1 h-10"
            >
              Apply {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SearchFilters);