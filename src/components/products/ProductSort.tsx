import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GemFashionStyleProps {
  sortOption: string;
  onSortChange: (value: string) => void;
  className?: string;
}

const GemFashionStyle = ({ sortOption, onSortChange, className = '' }: GemFashionStyleProps) => {
  return (
    <div className={`flex flex-col gap-2 w-64 p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 shadow-sm backdrop-blur-sm ${className}`}>
      {/* Fashion Brand Label */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-700/90 font-serif">
          Gem Fashion Style
        </span>
        <span className="h-1 w-1 rounded-full bg-amber-600 animate-pulse" />
      </div>

      {/* Styled Select Dropdown */}
      <Select value={sortOption} onValueChange={onSortChange}>
        <SelectTrigger className="w-full border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 hover:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 rounded-lg text-sm font-medium">
          <SelectValue placeholder="Curate Collection" />
        </SelectTrigger>
        <SelectContent className="border-zinc-200 bg-white/95 backdrop-blur-md rounded-lg shadow-lg">
          <SelectItem 
            value="featured" 
            className="text-zinc-700 focus:bg-amber-50 focus:text-amber-900 cursor-pointer transition-colors"
          >
            Featured Editorial
          </SelectItem>
          <SelectItem 
            value="price-low-high" 
            className="text-zinc-700 focus:bg-amber-50 focus:text-amber-900 cursor-pointer transition-colors"
          >
            Price: Low to High
          </SelectItem>
          <SelectItem 
            value="price-high-low" 
            className="text-zinc-700 focus:bg-amber-50 focus:text-amber-900 cursor-pointer transition-colors"
          >
            Price: High to Low
          </SelectItem>
          <SelectItem 
            value="newest" 
            className="text-zinc-700 focus:bg-amber-50 focus:text-amber-900 cursor-pointer transition-colors"
          >
            New Arrivals
          </SelectItem>
          <SelectItem 
            value="rating" 
            className="text-zinc-700 focus:bg-amber-50 focus:text-amber-900 cursor-pointer transition-colors"
          >
            Top Rated
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default GemFashionStyle;