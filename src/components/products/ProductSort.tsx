<<<<<<< HEAD

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductSortProps {
  sortOption: string;
  onSortChange: (value: string) => void;
  className?: string;
}

const ProductSort = ({ sortOption, onSortChange, className = '' }: ProductSortProps) => {
  return (
    <div className={`w-48 ${className}`}>
      <Select value={sortOption} onValueChange={onSortChange}>
        <SelectTrigger>
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="featured">Featured</SelectItem>
          <SelectItem value="price-low-high">Price: Low to High</SelectItem>
          <SelectItem value="price-high-low">Price: High to Low</SelectItem>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="rating">Rating</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductSort;
=======

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductSortProps {
  sortOption: string;
  onSortChange: (value: string) => void;
  className?: string;
}

const ProductSort = ({ sortOption, onSortChange, className = '' }: ProductSortProps) => {
  return (
    <div className={`w-48 ${className}`}>
      <Select value={sortOption} onValueChange={onSortChange}>
        <SelectTrigger>
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="featured">Featured</SelectItem>
          <SelectItem value="price-low-high">Price: Low to High</SelectItem>
          <SelectItem value="price-high-low">Price: High to Low</SelectItem>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="rating">Rating</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductSort;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
