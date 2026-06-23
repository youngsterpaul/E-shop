import { useState, useEffect, memo } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortOption {
  value: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'featured', label: 'Popular' },
  { value: 'price-low-high', label: 'Price Up' },
  { value: 'price-high-low', label: 'Price Down' },
  { value: 'rating', label: 'Top Sale' },
  { value: 'newest', label: 'Latest' },
];

interface MobileSortDropdownProps {
  sortOption: string;
  onSortChange: (value: string) => void;
}

const MobileSortDropdown = memo(({ sortOption, onSortChange }: MobileSortDropdownProps) => {
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
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex-1 flex items-center justify-between gap-2 px-4 h-10 rounded-lg border border-border bg-background text-sm font-medium transition-colors',
          open ? 'text-primary border-primary/40' : 'text-foreground'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{current.label}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Overlay + dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-150"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel — anchored just below the fixed sort bar */}
          <div
            role="listbox"
            className="fixed left-0 right-0 z-50 bg-background shadow-lg animate-in slide-in-from-top-2 duration-200"
            style={{ top: 'var(--mobile-sort-bar-bottom, 112px)' }}
          >
            <ul className="py-1">
              {SORT_OPTIONS.map(opt => {
                const isActive = opt.value === sortOption;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        'w-full flex items-center justify-between px-5 py-4 text-left text-base transition-colors border-b border-border/50 last:border-b-0',
                        isActive ? 'text-primary font-medium' : 'text-foreground'
                      )}
                    >
                      <span>{opt.label}</span>
                      {isActive && <Check className="h-5 w-5 text-primary" />}
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

MobileSortDropdown.displayName = 'MobileSortDropdown';

export default MobileSortDropdown;
