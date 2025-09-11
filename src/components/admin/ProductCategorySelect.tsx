
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Category {
  id: string;
  name: string;
  category: string;
  parent_id: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  category: string;
  parent_id: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  categories: string;
  featured: boolean;
  features: string;
  specification: string;
}

interface ProductCategorySelectProps {
  form: UseFormReturn<ProductFormData>;
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategory: string;
  selectedSubcategory: string;
  categoryName: string;
  subcategoryName: string;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
}

const ProductCategorySelect: React.FC<ProductCategorySelectProps> = ({
  form,
  categories,
  subcategories,
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category*</Label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcategory">Subcategory</Label>
        <Select 
          value={selectedSubcategory} 
          onValueChange={onSubcategoryChange}
          disabled={!selectedCategory}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a subcategory" />
          </SelectTrigger>
          <SelectContent>
            {subcategories.map((subcategory) => (
              <SelectItem key={subcategory.id} value={subcategory.id}>
                {subcategory.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductCategorySelect;
