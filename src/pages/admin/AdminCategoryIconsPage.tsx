import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Grid3x3, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';

interface CategoryIconData {
  id: number;
  name: string;
  icon_name: string;
  category_id: number;
  subcategory_id: number | null;
  color: string;
  icon_color: string;
  product_image: string | null;
  display_order: number;
  is_active: boolean;
  category?: {
    id: number;
    category: string;
    slug: string | null;
  };
  subcategory?: {
    id: number;
    category: string;
    slug: string | null;
  };
}

interface Category {
  id: number;
  category: string;
  parent_id: number | null;
  slug: string | null;
}

const ICON_OPTIONS = [
  'Smartphone', 'Laptop', 'Headphones', 'Camera', 'Watch', 'Gamepad2',
  'Tv', 'Speaker', 'Monitor', 'Tablet', 'Router', 'Battery',
  'Keyboard', 'Mouse', 'HardDrive', 'Usb', 'Printer', 'Wifi', 'Car', 'Home'
];

const COLOR_OPTIONS = [
  { value: 'bg-blue-50', label: 'Blue', iconColor: 'text-blue-600' },
  { value: 'bg-green-50', label: 'Green', iconColor: 'text-green-600' },
  { value: 'bg-red-50', label: 'Red', iconColor: 'text-red-600' },
  { value: 'bg-yellow-50', label: 'Yellow', iconColor: 'text-yellow-600' },
  { value: 'bg-indigo-50', label: 'Indigo', iconColor: 'text-indigo-600' },
  { value: 'bg-pink-50', label: 'Pink', iconColor: 'text-pink-600' },
  { value: 'bg-purple-50', label: 'Purple', iconColor: 'text-purple-600' },
  { value: 'bg-teal-50', label: 'Teal', iconColor: 'text-teal-600' },
  { value: 'bg-orange-50', label: 'Orange', iconColor: 'text-orange-600' },
  { value: 'bg-cyan-50', label: 'Cyan', iconColor: 'text-cyan-600' },
];

const AdminCategoryIconsPage = () => {
  const { toast } = useToast();
  
  // Fetch category icons with joined data
  const { data: categoryIcons, isLoading, refetch } = useQuery({
    queryKey: ['admin-category-icons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_icons')
        .select(`
          *,
          category:categories!category_icons_category_id_fkey(id, category, slug),
          subcategory:categories!category_icons_subcategory_id_fkey(id, category, slug)
        `)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as CategoryIconData[];
    }
  });

  // Fetch all categories for dropdowns
  const { data: allCategories } = useQuery({
    queryKey: ['all-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    }
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon_name: 'Smartphone',
    category_id: '',
    subcategory_id: '',
    color: 'bg-blue-50',
    icon_color: 'text-blue-600',
    product_image: '',
    display_order: '0',
    is_active: true
  });

  // Get parent categories (those without parent_id)
  const parentCategories = allCategories?.filter(cat => cat.parent_id === null) || [];
  
  // Get subcategories based on selected parent
  const subcategories = allCategories?.filter(cat => cat.parent_id === selectedParentId) || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (color: string) => {
    const colorOption = COLOR_OPTIONS.find(opt => opt.value === color);
    setFormData(prev => ({ 
      ...prev, 
      color,
      icon_color: colorOption?.iconColor || 'text-blue-600'
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({ ...prev, category_id: categoryId, subcategory_id: '' }));
    setSelectedParentId(parseInt(categoryId));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon_name: 'Smartphone',
      category_id: '',
      subcategory_id: '',
      color: 'bg-blue-50',
      icon_color: 'text-blue-600',
      product_image: '',
      display_order: '0',
      is_active: true
    });
    setSelectedParentId(null);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('category_icons')
        .insert({
          name: formData.name,
          icon_name: formData.icon_name,
          category_id: parseInt(formData.category_id),
          subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
          color: formData.color,
          icon_color: formData.icon_color,
          product_image: formData.product_image || null,
          display_order: formData.display_order ? parseInt(formData.display_order) : 0,
          is_active: formData.is_active
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category icon added successfully",
      });

      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error adding category icon:', error);
      toast({
        title: "Error",
        description: "Failed to add category icon",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (categoryIcon: CategoryIconData) => {
    setEditingId(categoryIcon.id);
    setFormData({
      name: categoryIcon.name,
      icon_name: categoryIcon.icon_name,
      category_id: categoryIcon.category_id.toString(),
      subcategory_id: categoryIcon.subcategory_id?.toString() || '',
      color: categoryIcon.color,
      icon_color: categoryIcon.icon_color,
      product_image: categoryIcon.product_image || '',
      display_order: categoryIcon.display_order.toString(),
      is_active: categoryIcon.is_active
    });
    setSelectedParentId(categoryIcon.category_id);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('category_icons')
        .update({
          name: formData.name,
          icon_name: formData.icon_name,
          category_id: parseInt(formData.category_id),
          subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
          color: formData.color,
          icon_color: formData.icon_color,
          product_image: formData.product_image || null,
          display_order: formData.display_order ? parseInt(formData.display_order) : 0,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category icon updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingId(null);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error updating category icon:', error);
      toast({
        title: "Error",
        description: "Failed to update category icon",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('category_icons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category icon deleted successfully",
      });

      refetch();
    } catch (error) {
      console.error('Error deleting category icon:', error);
      toast({
        title: "Error",
        description: "Failed to delete category icon",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('category_icons')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Category icon ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      refetch();
    } catch (error) {
      console.error('Error toggling category icon:', error);
      toast({
        title: "Error",
        description: "Failed to update category icon status",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    if (!categoryIcons) return;

    const currentIndex = categoryIcons.findIndex(cat => cat.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categoryIcons.length) return;

    try {
      const current = categoryIcons[currentIndex];
      const swap = categoryIcons[newIndex];

      await supabase
        .from('category_icons')
        .update({ display_order: swap.display_order })
        .eq('id', current.id);

      await supabase
        .from('category_icons')
        .update({ display_order: current.display_order })
        .eq('id', swap.id);

      toast({
        title: "Success",
        description: "Category order updated",
      });

      refetch();
    } catch (error) {
      console.error('Error reordering:', error);
      toast({
        title: "Error",
        description: "Failed to reorder categories",
        variant: "destructive",
      });
    }
  };

  const FormFields = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Display Name*</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Phones"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon_name">Icon*</Label>
        <Select value={formData.icon_name} onValueChange={(value) => setFormData(prev => ({ ...prev, icon_name: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select icon" />
          </SelectTrigger>
          <SelectContent>
            {ICON_OPTIONS.map(icon => (
              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Parent Category*</Label>
        <Select value={formData.category_id} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select parent category" />
          </SelectTrigger>
          <SelectContent>
            {parentCategories.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.category_id && subcategories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subcategory_id">Subcategory (Optional)</Label>
          <Select value={formData.subcategory_id} onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {subcategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="color">Background Color*</Label>
        <Select value={formData.color} onValueChange={handleColorChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select color" />
          </SelectTrigger>
          <SelectContent>
            {COLOR_OPTIONS.map(color => (
              <SelectItem key={color.value} value={color.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${color.value}`}></div>
                  {color.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_image">Product Image URL</Label>
        <Input
          id="product_image"
          name="product_image"
          placeholder="https://example.com/image.jpg"
          value={formData.product_image}
          onChange={handleInputChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_order">Display Order*</Label>
        <Input
          id="display_order"
          name="display_order"
          type="number"
          placeholder="0"
          value={formData.display_order}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Category Icons</h1>
            <p className="text-muted-foreground">Manage homepage category icons</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Icon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Category Icon</DialogTitle>
                <DialogDescription>
                  Create a new category icon for the homepage
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <FormFields />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Icon</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Category Icon</DialogTitle>
                <DialogDescription>
                  Update category icon information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdate}>
                <FormFields />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Icon</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Icons</CardTitle>
              <Grid3x3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryIcons?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Category icons configured</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categoryIcons?.filter(c => c.is_active).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Visible to users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categoryIcons?.filter(c => !c.is_active).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Hidden from users</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Category Icons</CardTitle>
            <CardDescription>View and manage all homepage category icons</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : !categoryIcons || categoryIcons.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Grid3x3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No category icons found</p>
                <p className="text-sm text-muted-foreground">
                  Add your first category icon to get started
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryIcons.map((icon, index) => (
                      <TableRow key={icon.id}>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleReorder(icon.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleReorder(icon.id, 'down')}
                              disabled={index === categoryIcons.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{icon.name}</TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center justify-center p-2 rounded ${icon.color}`}>
                            <span className={`text-sm ${icon.icon_color}`}>{icon.icon_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{icon.category?.category || 'Unknown'}</div>
                            {icon.subcategory && (
                              <div className="text-muted-foreground text-xs">
                                {icon.subcategory.category}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(icon.id, icon.is_active)}
                            className="h-8"
                          >
                            {icon.is_active ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(icon)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(icon.id, icon.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCategoryIconsPage;