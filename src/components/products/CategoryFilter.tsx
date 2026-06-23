import { Checkbox } from '@/components/ui/checkbox';

interface CategoryData {
  id: string;
  name: string;
  product_count?: number;
}

interface GemFashionStyleFilterProps {
  categories: CategoryData[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
}

const GemFashionStyleFilter = ({ 
  categories, 
  selectedCategories, 
  onToggleCategory 
}: GemFashionStyleFilterProps) => {
  return (
    <div className="space-y-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg max-w-xs tracking-wide">
      {/* Luxury Brand Header */}
      <div className="border-b border-zinc-800 pb-2 mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-100/70">
          Gem Fashion Style
        </h3>
      </div>

      {/* Categories List */}
      <div className="space-y-2.5">
        {categories.map((category) => {
          const isChecked = selectedCategories.includes(category.name);
          
          return (
            <div 
              key={category.id} 
              className="flex items-center justify-between py-1 group transition-colors duration-200"
            >
              <div className="flex items-center">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={isChecked}
                  onCheckedChange={() => onToggleCategory(category.name)}
                  className="border-zinc-700 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 transition-colors"
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className={`ml-3 text-xs font-light uppercase tracking-wider cursor-pointer transition-colors duration-200 ${
                    isChecked 
                      ? 'text-amber-400 font-medium' 
                      : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  {category.name}
                </label>
              </div>
              
              {category.product_count !== undefined && (
                <span className={`text-[10px] font-mono transition-colors duration-200 ${
                  isChecked ? 'text-amber-500/80' : 'text-zinc-600 group-hover:text-zinc-400'
                }`}>
                  [{category.product_count}]
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GemFashionStyleFilter;