import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryItem from './CategoryItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface Category {
  id: number;
  category: string;
  slug: string | null; 
  parent_id: number | null;
  display_order?: number;
}

interface CategoriesListProps {
  mainCategories: Category[];
  getSubcategories: (parentId: number) => Category[];
  onEdit: (id: number, name: string, slug: string, parentId: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onReorder: (reorderedCategories: Category[]) => Promise<void>;
  isSubmitting: boolean;
}

const CategoriesList = ({ 
  mainCategories, 
  getSubcategories, 
  onEdit, 
  onDelete,
  onReorder,
  isSubmitting 
}: CategoriesListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = mainCategories.findIndex((cat) => cat.id === active.id);
      const newIndex = mainCategories.findIndex((cat) => cat.id === over.id);

      const reordered = arrayMove(mainCategories, oldIndex, newIndex);
      onReorder(reordered);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Structure</CardTitle>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={mainCategories.map((cat) => cat.id)}
            strategy={verticalListSortingStrategy}
          >
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
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};

export default CategoriesList;

