<<<<<<< HEAD

import { Button } from '@/components/ui/button';
import { Sliders } from 'lucide-react';
import ProductSort from './ProductSort';

interface ProductHeaderProps {
  title: string;
  productCount: number;
  sortOption: string;
  onSortChange: (value: string) => void;
  onFiltersToggle?: () => void;
  showMobileFilters?: boolean;
}

const ProductHeader = ({
  title,
  productCount,
  sortOption,
  onSortChange,
  onFiltersToggle,
  showMobileFilters = false
}: ProductHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-500">
          {productCount} products found
        </p>
      </div>

      <div className="flex items-center gap-4">
        <ProductSort 
          sortOption={sortOption}
          onSortChange={onSortChange}
        />

        {showMobileFilters && onFiltersToggle && (
          <Button
            variant="outline"
            className="md:hidden"
            onClick={onFiltersToggle}
          >
            <Sliders className="h-4 w-4 mr-2" />
            Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductHeader;
=======

import { Button } from '@/components/ui/button';
import { Sliders } from 'lucide-react';
import ProductSort from './ProductSort';

interface ProductHeaderProps {
  title: string;
  productCount: number;
  sortOption: string;
  onSortChange: (value: string) => void;
  onFiltersToggle?: () => void;
  showMobileFilters?: boolean;
}

const ProductHeader = ({
  title,
  productCount,
  sortOption,
  onSortChange,
  onFiltersToggle,
  showMobileFilters = false
}: ProductHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-500">
          {productCount} products found
        </p>
      </div>

      <div className="flex items-center gap-4">
        <ProductSort 
          sortOption={sortOption}
          onSortChange={onSortChange}
        />

        {showMobileFilters && onFiltersToggle && (
          <Button
            variant="outline"
            className="md:hidden"
            onClick={onFiltersToggle}
          >
            <Sliders className="h-4 w-4 mr-2" />
            Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductHeader;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
