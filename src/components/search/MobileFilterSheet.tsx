import { useState, memo } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import SearchFilters, { FilterState } from './SearchFilters';
import { Product } from '@/hooks/useProducts';

interface MobileFilterSheetProps {
  products: Product[];
  onFiltersChange: (filters: FilterState) => void;
  activeFiltersCount: number;
}

const MobileFilterSheet = memo(({ products, onFiltersChange, activeFiltersCount }: MobileFilterSheetProps) => {
  const [open, setOpen] = useState(false);

  const handleFiltersChange = (filters: FilterState) => {
    onFiltersChange(filters);
  };

  const handleApply = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 min-w-[7rem]">
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85%] max-w-sm p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-gray-200">
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Products
          </SheetTitle>
        </SheetHeader>
        <SearchFilters 
          products={products} 
          onFiltersChange={handleFiltersChange}
          onApply={handleApply}
          className="border-0 rounded-none flex-1"
        />
      </SheetContent>
    </Sheet>
  );
});

MobileFilterSheet.displayName = 'MobileFilterSheet';

export default MobileFilterSheet;