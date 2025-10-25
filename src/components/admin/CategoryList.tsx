import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryItem from './CategoryItem';

interface Category {
  id: number;
  category: string;
  slug: string; 
  parent_id: number | null;
}

interface CategoriesListProps {
  mainCategories: Category[];
  getSubcategories: (parentId: number) => Category[];
  onEdit: (id: number, name: string, slug: string, parentId: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isSubmitting: boolean;
}

const CategoriesList = ({ 
  mainCategories, 
  getSubcategories, 
  onEdit, 
  onDelete, 
  isSubmitting 
}: CategoriesListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Structure</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mainCategories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              mainCategories={mainCategories}
              subcategories={getSubcategories(category.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              isSubmitting={isSubmitting}
            />
          ))}
          {mainCategories.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No categories found. Add your first category to get started.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoriesList;

