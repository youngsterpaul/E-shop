import { useState, useEffect, memo } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortOption {
  value: string;
  label: string;
}

// Updated labels to reflect an elegant "Gem Fashion Style" curation
const SORT_OPTIONS: SortOption[] = [
  { value: 'featured', label: 'Gem Curated' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
  { value: 'rating', label: 'Most Coveted' },
  { value: 'newest', label: 'New Arrivals' },
];

interface GemFashionSortDropdownProps {
  sortOption: string;
  onSortChange: (value: string) => void;
}

const GemFashionSortDropdown = memo(({ sortOption, onSortChange }: GemFashionSortDropdownProps) => {
  const [open, setOpen] = useState(false);

  const current = SORT_OPTIONS.find(o => o.value === sortOption) ?? SORT_OPTIONS[0];

  // Lock scroll when overlay is open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  const handleSelect = (value: string) => {
    onSortChange(value);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger Button: Styled with sleek fashion-house borders and minimal typography */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex-1 flex items-center justify-between gap-3 px-5 h-11 rounded-none border border-neutral-800 bg-neutral-950 text-xs tracking-widest uppercase transition-all duration-300',
          open 
            ? 'text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
            : 'text-neutral-200 hover:text-white hover:border-neutral-500'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate font-medium">{current.label}</span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400 transition-transform duration-300" />
        )}
      </button>

      {/* Overlay + dropdown panel */}
      {open && (
        <>
          {/* High-fashion premium dimmed backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Premium Dropdown Panel: Anchored below the fixed sort bar */}
          <div
            role="listbox"
            className="fixed left-0 right-0 z-50 bg-neutral-950 border-b border-neutral-800 shadow-2xl animate-in slide-in-from-top-4 duration-300 ease-out"
            style={{ top: 'var(--mobile-sort-bar-bottom, 112px)' }}
          >
            <div className="px-5 pt-3 pb-1 border-b border-neutral-900">
              <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
                Gem Fashion Style / Sort By
              </p>
            </div>
            <ul className="py-2">
              {SORT_OPTIONS.map(opt => {
                const isActive = opt.value === sortOption;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        'w-full flex items-center justify-between px-5 py-4 text-left text-sm tracking-wide transition-all duration-200 border-b border-neutral-900/50 last:border-b-0',
                        isActive 
                          ? 'text-emerald-400 font-semibold bg-emerald-950/20' 
                          : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/40'
                      )}
                    >
                      <span className={cn(isActive && 'translate-x-1 transition-transform duration-200')}>
                        {opt.label}
                      </span>
                      {isActive && (
                        <Check className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </>
  );
});

GemFashionSortDropdown.displayName = 'GemFashionSortDropdown';

export default GemFashionSortDropdown;