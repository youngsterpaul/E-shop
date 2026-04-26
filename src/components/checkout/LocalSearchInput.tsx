import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { X, MapPin } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';

interface LocationSearchInputProps {
  countyValue: string;
  cityValue: string;
  onSelect: (county: string, city: string) => void;
  error?: string;
  placeholder?: string;
}

interface MergedOption {
  countyValue: string;
  countyLabel: string;
  cityValue: string;
  cityLabel: string;
  display: string;
}

export const LocationSearchInput = ({
  countyValue,
  cityValue,
  onSelect,
  error,
  placeholder = 'Search town, city or county...',
}: LocationSearchInputProps) => {
  const { counties, cities, isLoading } = useLocations();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allOptions: MergedOption[] = useMemo(() => {
    if (!counties || !cities) return [];
    const countyMap = new Map(counties.map((c) => [c.id, c]));
    return cities
      .map((city) => {
        const county = countyMap.get(city.county_id);
        if (!county) return null;
        return {
          countyValue: county.slug,
          countyLabel: county.name,
          cityValue: city.slug,
          cityLabel: city.name,
          display: `${city.name}, ${county.name} County`,
        } as MergedOption;
      })
      .filter((o): o is MergedOption => o !== null);
  }, [counties, cities]);

  // Initialize query from selected values
  useEffect(() => {
    if (countyValue && cityValue && !query) {
      const match = allOptions.find(
        (o) => o.countyValue === countyValue && o.cityValue === cityValue
      );
      if (match) setQuery(match.display);
    }
  }, [countyValue, cityValue, allOptions]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions.slice(0, 20);
    return allOptions
      .filter(
        (o) =>
          o.cityLabel.toLowerCase().includes(q) ||
          o.countyLabel.toLowerCase().includes(q) ||
          o.display.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [query, allOptions]);

  const handleSelect = (option: MergedOption) => {
    setQuery(option.display);
    onSelect(option.countyValue, option.cityValue);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onSelect('', '');
    setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={isLoading ? 'Loading locations...' : placeholder}
          disabled={isLoading}
          className={`pl-10 pr-10 ${error ? 'border-red-500' : ''}`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && !isLoading && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No locations found for "{query}"
            </div>
          ) : (
            filtered.map((option) => (
              <button
                key={`${option.countyValue}-${option.cityValue}`}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full text-left px-4 py-2.5 hover:bg-muted border-b border-border last:border-0 transition-colors"
              >
                <div className="font-semibold text-sm text-foreground">
                  {option.cityLabel}, {option.countyLabel} County
                </div>
                <div className="text-xs text-muted-foreground">{option.countyLabel} County</div>
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

