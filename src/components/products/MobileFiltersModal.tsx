
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import ProductFilters from './ProductFilters';

interface MobileFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  openSections: string[];
  onToggleSection: (section: string) => void;
  // All the filter props
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
  categories: Array<{ id: string; name: string; }>;
  subcategories: Array<{ id: string; name: string; }>;
}

const MobileFiltersModal = ({
  isOpen,
  onClose,
  openSections,
  onToggleSection,
  ...filterProps
}: MobileFiltersModalProps) => {
  const mobileFilterRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && mobileFilterRef.current) {
        const target = event.target as Node;
        if (!mobileFilterRef.current.contains(target)) {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
      <div 
        ref={mobileFilterRef}
        className="absolute right-0 top-0 bottom-0 w-[80%] max-w-md bg-white overflow-y-auto"
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 border-b">
            <h2 className="text-xl font-bold">Filters</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ProductFilters
            {...filterProps}
            isMobile={true}
            openSections={openSections}
            onToggleSection={onToggleSection}
          />

          <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-white mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={filterProps.onResetFilters}
            >
              Reset
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={onClose}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFiltersModal;
