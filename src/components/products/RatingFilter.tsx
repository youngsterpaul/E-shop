import { Checkbox } from '@/components/ui/checkbox';

interface RatingFilterProps {
  selectedRatings: number[];
  onToggleRating: (rating: number) => void;
}

const GemFashionStyleRatingFilter = ({ selectedRatings, onToggleRating }: RatingFilterProps) => {
  return (
    <div className="p-5 bg-stone-50/50 border border-stone-200/60 rounded-xl tracking-wide max-w-xs shadow-sm">
      {/* Brand Header */}
      <div className="mb-4">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-700 block mb-0.5">
          Gem Fashion Style
        </span>
        <h3 className="font-serif text-lg font-medium text-stone-900 border-b border-stone-200/80 pb-2">
          Filter By Rating
        </h3>
      </div>

      {/* Ratings List */}
      <div className="space-y-3.5 pt-1">
        {[4, 3, 2, 1].map((rating) => {
          const isChecked = selectedRatings.includes(rating);
          return (
            <div 
              key={rating} 
              className="flex items-center group transition-colors duration-200"
            >
              <Checkbox
                id={`rating-${rating}`}
                checked={isChecked}
                onCheckedChange={() => onToggleRating(rating)}
                className="border-stone-400 data-[state=checked]:bg-emerald-800 data-[state=checked]:border-emerald-800 rounded-[4px] transition-all"
              />
              <label
                htmlFor={`rating-${rating}`}
                className={`ml-3 text-xs uppercase font-semibold tracking-wider cursor-pointer select-none transition-colors duration-200 ${
                  isChecked 
                    ? 'text-emerald-900 font-bold' 
                    : 'text-stone-600 group-hover:text-stone-900'
                }`}
              >
                {rating}★ <span className="text-[10px] text-stone-400 font-normal ml-0.5">& Up</span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GemFashionStyleRatingFilter;