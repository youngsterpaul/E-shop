
import { Checkbox } from '@/components/ui/checkbox';
import { Subcategory } from '@/data/realCategoryData';

interface SubcategoryFilterProps {
  subcategories: Subcategory[];
  selectedSubcategories: string[];
  onToggleSubcategory: (subcategory: string) => void;
  selectedCategories: string[];
}

const SubcategoryFilter = ({ 
  subcategories, 
  selectedSubcategories, 
  onToggleSubcategory,
  selectedCategories 
}: SubcategoryFilterProps) => {
  if (selectedCategories.length === 0 || subcategories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {subcategories.map((subcategory) => (
        <div key={subcategory.id} className="flex items-center">
          <Checkbox
            id={`subcategory-${subcategory.id}`}
            checked={selectedSubcategories.includes(subcategory.name)}
            onCheckedChange={() => onToggleSubcategory(subcategory.name)}
          />
          <label
            htmlFor={`subcategory-${subcategory.id}`}
            className="ml-2 text-sm font-medium cursor-pointer"
          >
            {subcategory.name}
          </label>
        </div>
      ))}
    </div>
  );
};

export default SubcategoryFilter;
