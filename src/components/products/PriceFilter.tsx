
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface PriceFilterProps {
  priceRange: [number, number];
  onPriceChange: (value: [number, number]) => void;
}

const PriceFilter = ({ priceRange, onPriceChange }: PriceFilterProps) => {
  return (
    <div>
      <h3 className="font-medium mb-4">Price Range</h3>
      <Slider
        defaultValue={priceRange}
        min={0}
        max={100000}
        step={1000}
        onValueChange={onPriceChange as (value: number[]) => void}
        className="mb-6"
      />
      <div className="flex justify-between">
        <div className="w-[45%]">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) =>
              onPriceChange([
                Number(e.target.value),
                priceRange[1],
              ])
            }
            className="h-9"
            placeholder="Min"
          />
        </div>
        <span className="flex items-center">-</span>
        <div className="w-[45%]">
          <Input
            type="number"
            value={priceRange[1]}
            onChange={(e) =>
              onPriceChange([
                priceRange[0],
                Number(e.target.value),
              ])
            }
            className="h-9"
            placeholder="Max"
          />
        </div>
      </div>
    </div>
  );
};

export default PriceFilter;
