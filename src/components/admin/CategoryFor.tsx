

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

interface Category {
  id: number;
  category: string;
  parent_id: number | null;
}

interface CategoryFormProps {
  categories: Category[];
  onAddCategory: (name: string, parentId: string) => Promise<void>;
  isSubmitting: boolean;
}

const CategoryForm = ({ categories, onAddCategory, isSubmitting }: CategoryFormProps) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('none');

  const handleSubmit = async () => {
    if (!newCategoryName.trim()) return;
    
    const parentId = selectedParentCategory === 'none' ? '' : selectedParentCategory;
    await onAddCategory(newCategoryName.trim(), parentId);
    setNewCategoryName('');
    setSelectedParentCategory('none');
  };

  const mainCategories = categories.filter(cat => cat.parent_id === null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="categoryName">Category Name</Label>
          <Input
            id="categoryName"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Enter category name"
          />
        </div>
        
        <div>
          <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
          <Select value={selectedParentCategory} onValueChange={setSelectedParentCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select parent category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Main Category)</SelectItem>
              {mainCategories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !newCategoryName.trim()}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CategoryForm;
