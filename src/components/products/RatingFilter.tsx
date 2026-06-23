
import { Checkbox } from '@/components/ui/checkbox';

interface RatingFilterProps {
  selectedRatings: number[];
  onToggleRating: (rating: number) => void;
}

const RatingFilter = ({ selectedRatings, onToggleRating }: RatingFilterProps) => {
  return (
    <div>
      <h3 className="font-medium mb-4">Rating</h3>
      <div className="space-y-2">
        {[4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center">
            <Checkbox
              id={`rating-${rating}`}
              checked={selectedRatings.includes(rating)}
              onCheckedChange={() => onToggleRating(rating)}
            />
            <label
              htmlFor={`rating-${rating}`}
              className="ml-2 text-sm font-medium cursor-pointer"
            >
              {rating}★ & Up
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingFilter;
