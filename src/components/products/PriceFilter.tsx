import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface GemFashionStyleProps {
  priceRange: [number, number];
  onPriceChange: (value: [number, number]) => void;
}

const GemFashionStyle = ({ priceRange, onPriceChange }: GemFashionStyleProps) => {
  return (
    <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 shadow-sm max-w-sm tracking-wide">
      <h3 className="font-serif text-lg font-semibold text-stone-900 mb-5 uppercase tracking-wider">
        Price Range
      </h3>
      
      {/* Premium Fashion Brand Slider Styling */}
      <Slider
        defaultValue={priceRange}
        min={0}
        max={100000}
        step={1000}
        onValueChange={onPriceChange as (value: number[]) => void}
        className="mb-6 accent-amber-700 cursor-pointer"
      />
      
      <div className="flex items-center justify-between gap-3">
        {/* Min Price Input Container */}
        <div className="w-[45%]">
          <label className="block text-xs font-medium uppercase text-stone-500 mb-1.5 tracking-tight">
            Min Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) =>
                onPriceChange([
                  Number(e.target.value),
                  priceRange[1],
                ])
              }
              className="h-10 pl-7 bg-white border-stone-300 focus:border-amber-600 focus:ring-amber-600 rounded-md shadow-inner text-stone-800 font-medium"
              placeholder="0"
            />
          </div>
        </div>

        <span className="flex items-center text-stone-400 font-light mt-5">—</span>

        {/* Max Price Input Container */}
        <div className="w-[45%]">
          <label className="block text-xs font-medium uppercase text-stone-500 mb-1.5 tracking-tight">
            Max Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) =>
                onPriceChange([
                  priceRange[0],
                  Number(e.target.value),
                ])
              }
              className="h-10 pl-7 bg-white border-stone-300 focus:border-amber-600 focus:ring-amber-600 rounded-md shadow-inner text-stone-800 font-medium"
              placeholder="100,000"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GemFashionStyle;