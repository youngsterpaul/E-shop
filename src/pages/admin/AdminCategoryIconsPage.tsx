import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SmartPagination from '@/components/ui/pagination';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCategoryIconsAdmin } from '@/hooks/useCategoryIconsAdmin';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';

// Sortable row component
const SortableRow = ({ icon, onEdit, onDelete }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: icon.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Smartphone;
    return Icon;
  };

  const Icon = IconComponent(icon.icon_name);

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </TableCell>
      <TableCell>
        <div className={`${icon.color} ${icon.icon_color} p-3 rounded-lg inline-block`}>
          <Icon className="h-6 w-6" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{icon.name}</TableCell>
      <TableCell>{icon.category?.category || 'N/A'}</TableCell>
      <TableCell>{icon.subcategory?.category || '-'}</TableCell>
      <TableCell>{icon.display_order}</TableCell>
      <TableCell>
        <Badge variant={icon.is_active ? 'default' : 'secondary'}>
          {icon.is_active ? (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(icon)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(icon.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const AdminCategoryIconsPage = () => {
  const { categoryIcons, categories, isLoading, isSubmitting, handleCreate, handleUpdate, handleDelete, handleReorder } =
    useCategoryIconsAdmin();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIcon, setEditingIcon] = useState<any>(null);
  const [deleteIconId, setDeleteIconId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [localIcons, setLocalIcons] = useState<any[]>([]);
  
  const itemsPerPage = 10;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local icons when data changes
  useEffect(() => {
    setLocalIcons(categoryIcons);
  }, [categoryIcons]);

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIcons = localIcons.slice(startIndex, endIndex);

  const [formData, setFormData] = useState({
    name: '',
    icon_name: 'Smartphone',
    category_id: null as number | null,
    subcategory_id: null as number | null,
    color: 'bg-blue-50',
    icon_color: 'text-blue-600',
    product_image: null as string | null,
    display_order: 0,
    is_active: true,
  });

  const mainCategories = categories.filter((c: any) => !c.parent_id);
  const getSubcategories = (parentId: number) =>
    categories.filter((c: any) => c.parent_id === parentId);

  const iconOptions = [
    'Smartphone', 'Laptop', 'Headphones', 'Camera', 'Watch', 'Gamepad2',
    'Tv', 'Speaker', 'Monitor', 'Tablet', 'Router', 'Battery',
    'Keyboard', 'Mouse', 'HardDrive', 'Usb', 'Printer', 'Wifi', 'Car', 'Home'
  ];

  const colorOptions = [
    { value: 'bg-blue-50', label: 'Blue', iconColor: 'text-blue-600' },
    { value: 'bg-green-50', label: 'Green', iconColor: 'text-green-600' },
    { value: 'bg-purple-50', label: 'Purple', iconColor: 'text-purple-600' },
    { value: 'bg-red-50', label: 'Red', iconColor: 'text-red-600' },
    { value: 'bg-yellow-50', label: 'Yellow', iconColor: 'text-yellow-600' },
    { value: 'bg-pink-50', label: 'Pink', iconColor: 'text-pink-600' },
    { value: 'bg-indigo-50', label: 'Indigo', iconColor: 'text-indigo-600' },
    { value: 'bg-orange-50', label: 'Orange', iconColor: 'text-orange-600' },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      icon_name: 'Smartphone',
      category_id: null,
      subcategory_id: null,
      color: 'bg-blue-50',
      icon_color: 'text-blue-600',
      product_image: null,
      display_order: 0,
      is_active: true,
    });
    setEditingIcon(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (icon: any) => {
    setEditingIcon(icon);
    setFormData({
      name: icon.name,
      icon_name: icon.icon_name,
      category_id: icon.category_id,
      subcategory_id: icon.subcategory_id,
      color: icon.color,
      icon_color: icon.icon_color,
      product_image: icon.product_image,
      display_order: icon.display_order,
      is_active: icon.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category_id) {
      return;
    }

    if (editingIcon) {
      await handleUpdate(editingIcon.id, formData);
    } else {
      await handleCreate(formData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const confirmDelete = async () => {
    if (deleteIconId) {
      await handleDelete(deleteIconId);
      setDeleteIconId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localIcons.findIndex((icon) => icon.id === active.id);
    const newIndex = localIcons.findIndex((icon) => icon.id === over.id);

    const reordered = arrayMove(localIcons, oldIndex, newIndex);
    setLocalIcons(reordered);
    await handleReorder(reordered);
  };

  const IconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Smartphone;
    return Icon;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Category Icons"
        onRefresh={() => window.location.reload()}
      />

      <div className="mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category Icon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingIcon ? 'Edit Category Icon' : 'Create Category Icon'}</DialogTitle>
              <DialogDescription>
                Configure the icon that will appear on the homepage category navigation.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Display Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Smartphones"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="icon">Icon *</Label>
                <Select
                  value={formData.icon_name}
                  onValueChange={(value) => setFormData({ ...formData, icon_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => {
                      const Icon = IconComponent(icon);
                      return (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{icon}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id?.toString() || undefined}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category_id: parseInt(value),
                      subcategory_id: null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.category_id && (
                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                  <Select
                    value={formData.subcategory_id?.toString() || undefined}
                    onValueChange={(value) =>
                      setFormData({ ...formData, subcategory_id: value ? parseInt(value) : null })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Subcategory</SelectItem>
                      {getSubcategories(formData.category_id).map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="color">Background Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => {
                    const colorOption = colorOptions.find((c) => c.value === value);
                    setFormData({
                      ...formData,
                      color: value,
                      icon_color: colorOption?.iconColor || 'text-blue-600',
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.value}`} />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product_image">Product Image URL (Optional)</Label>
                <Input
                  id="product_image"
                  value={formData.product_image || ''}
                  onChange={(e) => setFormData({ ...formData, product_image: e.target.value || null })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingIcon ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Icons</CardTitle>
          <CardDescription>Manage icons displayed on the homepage for category navigation</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIcons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No category icons yet. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  <SortableContext
                    items={paginatedIcons.map((icon) => icon.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {paginatedIcons.map((icon: any) => (
                      <SortableRow
                        key={icon.id}
                        icon={icon}
                        onEdit={openEditDialog}
                        onDelete={setDeleteIconId}
                      />
                    ))}
                  </SortableContext>
                )}
              </TableBody>
            </Table>
          </DndContext>

          {localIcons.length > itemsPerPage && (
            <SmartPagination
              currentPage={currentPage}
              totalPages={Math.ceil(localIcons.length / itemsPerPage)}
              totalItems={localIcons.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              showQuickJumper={false}
              showSizeChanger={false}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteIconId !== null} onOpenChange={() => setDeleteIconId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category icon. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminCategoryIconsPage;
