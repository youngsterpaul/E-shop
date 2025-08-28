
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useCategories } from '@/hooks/useCategories';

interface SubcategoryFilterProps {
  selectedCategories: string[];
  selectedSubcategories: string[];
  onToggleSubcategory: (subcategory: string) => void;
}

const SubcategoryFilter = ({
  selectedCategories,
  selectedSubcategories,
  onToggleSubcategory,
}: SubcategoryFilterProps) => {
  const { subcategories, fetchSubcategories } = useCategories();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubcats = async () => {
      if (selectedCategories.length === 1) {
        setLoading(true);
        // Find the category ID by name
        const categoryId = selectedCategories[0]; // Assuming we pass the ID
        await fetchSubcategories(categoryId);
        setLoading(false);
      }
    };

    fetchSubcats();
  }, [selectedCategories, fetchSubcategories]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading subcategories...</div>;
  }

  if (subcategories.length === 0) {
    return <div className="text-sm text-gray-500">No subcategories available</div>;
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
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
