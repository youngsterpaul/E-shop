
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Category {
  id: number;
  category: string;
  parent_id: number | null;
}

interface CategoryItemProps {
  category: Category;
  mainCategories: Category[];
  subcategories: Category[];
  onEdit: (id: number, name: string, parentId: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isSubmitting: boolean;
}

const CategoryItem = ({ 
  category, 
  mainCategories, 
  subcategories, 
  onEdit, 
  onDelete, 
  isSubmitting 
}: CategoryItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.category);
  const [editParent, setEditParent] = useState(category.parent_id ? category.parent_id.toString() : 'none');

  const handleEdit = async () => {
    if (!editName.trim()) return;
    
    const parentId = editParent === 'none' ? '' : editParent;
    await onEdit(category.id, editName.trim(), parentId);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(category.category);
    setEditParent(category.parent_id ? category.parent_id.toString() : 'none');
    setIsEditing(false);
  };

  const isMainCategory = category.parent_id === null;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        {isEditing ? (
          <div className="flex-1 space-y-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Category name"
            />
            {!isMainCategory && (
              <Select value={editParent} onValueChange={setEditParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Main Category)</SelectItem>
                  {mainCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className={`font-medium ${!isMainCategory ? 'text-sm text-gray-600' : ''}`}>
              {!isMainCategory && '└ '}
              {category.category}
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{category.category}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(category.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </div>
      
      {/* Subcategories */}
      {isMainCategory && subcategories.length > 0 && (
        <div className="ml-4 space-y-2">
          {subcategories.map((subcat) => (
            <CategoryItem
              key={subcat.id}
              category={subcat}
              mainCategories={mainCategories}
              subcategories={[]}
              onEdit={onEdit}
              onDelete={onDelete}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryItem;
