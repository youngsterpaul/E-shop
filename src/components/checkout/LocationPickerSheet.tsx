
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MapPin, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocations } from '@/hooks/useLocations';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface LocationPickerSheetProps {
  open: boolean;
  onClose: () => void;
  countyValue: string;
  cityValue: string;
  onConfirm: (county: string, city: string) => void;
}

interface MergedOption {
  countyValue: string;
  countyLabel: string;
  cityValue: string;
  cityLabel: string;
  deliveryFee: number;
}

export const LocationPickerSheet = ({
  open,
  onClose,
  countyValue,
  cityValue,
  onConfirm,
}: LocationPickerSheetProps) => {
  const { counties, cities, isLoading } = useLocations();
  const isMobile = isMobileUserAgent();
  const [query, setQuery] = useState('');
  const [tempCounty, setTempCounty] = useState(countyValue);
  const [tempCity, setTempCity] = useState(cityValue);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTempCounty(countyValue);
      setTempCity(cityValue);
      setQuery('');
    }
  }, [open, countyValue, cityValue]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const allOptions: MergedOption[] = useMemo(() => {
    if (!counties || !cities) return [];
    const countyMap = new Map(counties.map((c) => [c.id, c]));
    return cities
      .map((city) => {
        const county = countyMap.get(city.county_id);
        if (!county) return null;
        const cityFee = Number(city.delivery_fee || 0);
        const countyFee = Number(county.delivery_fee || 0);
        return {
          countyValue: county.slug,
          countyLabel: county.name,
          cityValue: city.slug,
          cityLabel: city.name,
          deliveryFee: cityFee > 0 ? cityFee : countyFee,
        } as MergedOption;
      })
      .filter((o): o is MergedOption => o !== null);
  }, [counties, cities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter(
      (o) =>
        o.cityLabel.toLowerCase().includes(q) ||
        o.countyLabel.toLowerCase().includes(q)
    );
  }, [query, allOptions]);

  // Group by county
  const grouped = useMemo(() => {
    const map = new Map<string, MergedOption[]>();
    filtered.forEach((opt) => {
      const arr = map.get(opt.countyLabel) || [];
      arr.push(opt);
      map.set(opt.countyLabel, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const handleSelect = (opt: MergedOption) => {
    setTempCounty(opt.countyValue);
    setTempCity(opt.cityValue);
  };

  const handleConfirm = () => {
    if (tempCounty && tempCity) {
      onConfirm(tempCounty, tempCity);
      onClose();
    }
  };

  if (!open) return null;

  const sheetContent = (
    <>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Choose Delivery Location</h2>
          {!isMobile && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or county..."
            className="pl-10 h-11 rounded-full bg-background"
            autoFocus={!isMobile}
          />
        </div>
      </div>

      {/* List - min-height keeps the sheet a consistent large size even with few/no results */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain min-h-[55vh]">
        {isLoading ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            Loading locations...
          </div>
        ) : grouped.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No locations found {query && `for "${query}"`}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {grouped.map(([countyLabel, options]) => (
              <div key={countyLabel} className="mb-2">
                <div className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                  {countyLabel}
                </div>
                {options.map((opt) => {
                  const isSelected =
                    tempCounty === opt.countyValue && tempCity === opt.cityValue;
                  return (
                    <button
                      key={`${opt.countyValue}-${opt.cityValue}`}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className={cn(
                        'w-full flex items-center justify-between px-5 py-3.5 transition-all active:scale-[0.99]',
                        isSelected
                          ? 'bg-primary/5'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full flex-shrink-0 transition-colors',
                            isSelected ? 'bg-primary' : 'bg-primary/30'
                          )}
                        />
                        <span
                          className={cn(
                            'text-[15px] truncate',
                            isSelected ? 'font-semibold text-foreground' : 'text-foreground/90'
                          )}
                        >
                          {opt.cityLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={cn(
                            'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                            opt.deliveryFee === 0
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {opt.deliveryFee === 0 ? 'FREE' : `KES ${opt.deliveryFee.toLocaleString()}`}
                        </span>
                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-4 border-t border-border/50 bg-background"
        style={{ paddingBottom: `calc(1rem + env(safe-area-inset-bottom))` }}
      >
        <Button
          onClick={handleConfirm}
          disabled={!tempCounty || !tempCity}
          className="w-full h-12 text-base font-semibold rounded-full"
        >
          Confirm Location
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
          onClick={onClose}
        />
        {/* Sheet — fixed large height so size stays consistent regardless of result count */}
        <div className="relative mt-auto bg-background rounded-t-3xl flex flex-col h-[85vh] animate-in slide-in-from-bottom duration-300 shadow-2xl">
          {/* Drag handle */}
          <div className="pt-2 pb-1 flex justify-center flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          {sheetContent}
        </div>
      </div>
    );
  }

  // Desktop overlay
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-background rounded-2xl flex flex-col w-full max-w-md h-[85vh] max-h-[700px] shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        {sheetContent}
      </div>
    </div>
  );
};

