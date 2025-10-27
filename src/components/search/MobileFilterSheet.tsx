<<<<<<< HEAD
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

const MobileFilterSheet = ({ products, onFiltersChange, activeFiltersCount }: MobileFilterSheetProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild className='w-28'>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-3/4 p-0">
        <SheetHeader className="p-4 border-b border-gray-200">
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Products
          </SheetTitle>
        </SheetHeader>
        <SearchFilters 
          products={products} 
          onFiltersChange={onFiltersChange}
          className="border-0 rounded-none h-full"
        />
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilterSheet;
=======
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

const MobileFilterSheet = ({ products, onFiltersChange, activeFiltersCount }: MobileFilterSheetProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild className='w-28'>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-3/4 p-0">
        <SheetHeader className="p-4 border-b border-gray-200">
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Products
          </SheetTitle>
        </SheetHeader>
        <SearchFilters 
          products={products} 
          onFiltersChange={onFiltersChange}
          className="border-0 rounded-none h-full"
        />
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilterSheet;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
