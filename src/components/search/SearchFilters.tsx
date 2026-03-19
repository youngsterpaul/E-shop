import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Product } from '@/hooks/useProducts';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { SpecConfig } from '@/utils/specConfig';

export interface FilterState {
  priceRange: [number, number];
  specifications: Record<string, string[]>;
  ratings: number[];
}

/**
 * Default spec config — covers the most universally useful filter specs.
 * Override per-page or per-category by passing a custom `specConfig` prop.
 *
 * Example for a laptop category page:
 *   const LAPTOP_SPECS: SpecConfig[] = [
 *     { key: 'brand',     label: 'Brand' },
 *     { key: 'processor', label: 'Processor' },
 *     { key: 'ram',       label: 'RAM' },
 *     { key: 'storage',   label: 'Storage' },
 *     { key: 'color',     label: 'Color' },
 *   ];
 *   <SearchFilters specConfig={LAPTOP_SPECS} ... />
 */
export const DEFAULT_SPEC_CONFIG: SpecConfig[] = [
  { key: 'brand',         label: 'Brand' },
  { key: 'storage',       label: 'Storage' },
  { key: 'ram',           label: 'RAM' },
  { key: 'processor',     label: 'Processor' },
  { key: 'screen_size',   label: 'Screen Size' },
  { key: 'connectivity',  label: 'Connectivity' },
  { key: 'interface',     label: 'Interface' },
  { key: 'material',      label: 'Material' },
  { key: 'weight',        label: 'Weight' },
  { key: 'dimensions',    label: 'Dimensions' },
  { key: 'compatibility', label: 'Compatibility' },
];

interface SearchFiltersProps {
  products: Product[];
  value?: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApply?: () => void;
  /**
   * Controls which spec keys appear as filters and in what order.
   * Pass a SpecConfig[] to whitelist specific specs.
   * Defaults to DEFAULT_SPEC_CONFIG if omitted.
   */
  specConfig?: SpecConfig[];
  className?: string;
}

const DEFAULT_FILTERS: FilterState = {
  priceRange: [0, 200000],
  specifications: {},
  ratings: [],
};

const FilterOption = memo(({
  id,
  label,
  checked,
  onToggle,
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
      className="rounded-[3px] h-4 w-4 shrink-0 border border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
    />
    <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer flex-1 leading-none">
      {label}
    </label>
  </div>
));
FilterOption.displayName = 'FilterOption';

const SearchFilters = ({
  products,
  value,
  onFiltersChange,
  onApply,
  specConfig = DEFAULT_SPEC_CONFIG,
  className,
}: SearchFiltersProps) => {
  const isMobile = isMobileUserAgent();

  const [localMin, setLocalMin] = useState(value?.priceRange[0] ?? 0);
  const [localMax, setLocalMax] = useState(value?.priceRange[1] ?? 200000);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
  });

  // Build spec value lists: only keys in specConfig, in config order
  const { specs, maxPrice } = useMemo(() => {
    if (!products?.length) {
      return { specs: [] as { key: string; label: string; values: string[] }[], maxPrice: 200000 };
    }

    // Normalize config keys to lowercase for case-insensitive matching
    const allowedKeys = new Set(specConfig.map(s => s.key.toLowerCase()));
    const specMap: Record<string, Set<string>> = {};
    let max = 0;

    for (const product of products) {
      if (product.price > max) max = product.price;

      if (product.specification && typeof product.specification === 'object') {
        for (const [rawKey, val] of Object.entries(product.specification)) {
          const key = rawKey.toLowerCase().trim(); // normalize DB key
          if (!allowedKeys.has(key) || !val || typeof val !== 'string') continue;
          (specMap[key] ??= new Set()).add(val);
        }
      }
    }

    // DEBUG: logs all spec keys found in products so you can match them in specConfig.ts
    if (process.env.NODE_ENV === 'development' && products.length > 0) {
      const allKeys = new Set<string>();
      products.forEach(p => {
        if (p.specification && typeof p.specification === 'object') {
          Object.keys(p.specification).forEach(k => allKeys.add(k));
        }
      });
      console.log('[SearchFilters] All spec keys in products:', Array.from(allKeys).sort());
      console.log('[SearchFilters] Matched keys:', Object.keys(specMap));
    }

    // Preserve specConfig order; skip keys with no values in this product set
    const specs = specConfig
      .filter(({ key }) => (specMap[key.toLowerCase()]?.size ?? 0) > 0)
      .map(({ key, label }) => ({
        key: key.toLowerCase(),
        label,
        values: Array.from(specMap[key.toLowerCase()]).sort(),
      }));

    return { specs, maxPrice: Math.ceil(max * 1.1) || 200000 };
  }, [products, specConfig]);

  useEffect(() => {
    setLocalMin(value?.priceRange[0] ?? 0);
    setLocalMax(value?.priceRange[1] ?? maxPrice);
  }, [value?.priceRange[0], value?.priceRange[1], maxPrice]);

  const filters = value ?? DEFAULT_FILTERS;

  const activeFiltersCount = useMemo(
    () =>
      Object.values(filters.specifications).flat().length +
      filters.ratings.length +
      (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0),
    [filters, maxPrice]
  );

  const toggleSection = useCallback((section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const toggleSpec = useCallback((specKey: string, val: string) => {
    const key = specKey.toLowerCase();
    const current = filters.specifications[key] ?? [];
    const next = current.includes(val)
      ? current.filter(v => v !== val)
      : [...current, val];

    onFiltersChange({
      ...filters,
      specifications: { ...filters.specifications, [key]: next },
    });
  }, [filters, onFiltersChange]);

  const applyPriceFilter = useCallback(() => {
    onFiltersChange({ ...filters, priceRange: [localMin, localMax] });
  }, [filters, localMin, localMax, onFiltersChange]);

  const resetFilters = useCallback(() => {
    const reset: FilterState = { priceRange: [0, maxPrice], specifications: {}, ratings: [] };
    setLocalMin(0);
    setLocalMax(maxPrice);
    onFiltersChange(reset);
    onApply?.();
  }, [maxPrice, onFiltersChange, onApply]);

  const applyFilters = useCallback(() => {
    onFiltersChange({ ...filters, priceRange: [localMin, localMax] });
    onApply?.();
  }, [filters, localMin, localMax, onFiltersChange, onApply]);

  return (
    <div className={`bg-background border border-gray-200 flex flex-col ${isMobile ? 'rounded-lg h-full' : ''} ${className}`}>
      <ScrollArea className={`flex-1 ${isMobile ? 'max-h-[calc(100vh-150px)]' : 'h-[calc(100vh-280px)]'}`}>
        <div className="p-4 space-y-4 pr-4">

          {/* Price Range */}
          <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-0">
              <h4 className="font-medium">Price</h4>
            </CollapsibleTrigger>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localMin}
                  onChange={e => setLocalMin(Number(e.target.value) || 0)}
                  className="h-8"
                  placeholder="Min"
                />
                <span className="text-gray-400">–</span>
                <Input
                  type="number"
                  value={localMax}
                  onChange={e => setLocalMax(Number(e.target.value) || 0)}
                  className="h-8"
                  placeholder="Max"
                />
              </div>
              <p className="text-xs text-gray-500">
                KES {localMin.toLocaleString()} – KES {localMax.toLocaleString()}
              </p>
              {!isMobile && (
                <Button onClick={applyPriceFilter} className="w-full h-8 text-sm" size="sm">
                  Apply
                </Button>
              )}
            </div>
          </Collapsible>

          <Separator />

          {/* Whitelisted specs in config-defined order */}
          {specs.map(({ key, label, values }) => {
            const isOpen = openSections[`spec_${key}`] ?? true;
            return (
              <div key={key}>
                <Collapsible open={isOpen} onOpenChange={() => toggleSection(`spec_${key}`)}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-0">
                    <h4 className="font-medium">{label}</h4>
                  </CollapsibleTrigger>
                  <div className="mt-3 space-y-2">
                    {values.map(val => (
                      <FilterOption
                        key={`${key}-${val}`}
                        id={`spec-${key}-${val}`}
                        label={val}
                        checked={filters.specifications[key]?.includes(val) ?? false}
                        onToggle={() => toggleSpec(key, val)}
                      />
                    ))}
                  </div>
                </Collapsible>
                <Separator className="my-4" />
              </div>
            );
          })}

        </div>
      </ScrollArea>

      {/* Mobile Actions */}
      {isMobile && (
        <div className="mt-auto border-t border-gray-200 p-3 bg-background sticky mb-20 bottom-0">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={resetFilters} className="flex-1 h-10">
              Reset
            </Button>
            <Button onClick={applyFilters} className="flex-1 h-10">
              Apply{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SearchFilters);