
import { Checkbox } from '@/components/ui/checkbox';

interface CategoryData {
  id: string;
  name: string;
  product_count?: number;
}

interface CategoryFilterProps {
  categories: CategoryData[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
}

const CategoryFilter = ({ categories, selectedCategories, onToggleCategory }: CategoryFilterProps) => {
  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category.id} className="flex items-center justify-between">
          <div className="flex items-center">
            <Checkbox
              id={`category-${category.id}`}
              checked={selectedCategories.includes(category.name)}
              onCheckedChange={() => onToggleCategory(category.name)}
            />
            <label
              htmlFor={`category-${category.id}`}
              className="ml-2 text-sm font-medium cursor-pointer"
            >
              {category.name}
            </label>
          </div>
          {category.product_count !== undefined && (
            <span className="text-xs text-gray-500">
              ({category.product_count})
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CategoryFilter;
