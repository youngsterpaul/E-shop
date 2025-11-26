import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Zap, Clock } from 'lucide-react';
import {
  useAllFlashSales,
  useCreateFlashSale,
  useUpdateFlashSale,
  useDeleteFlashSale,
  useToggleFlashSale,
  useFlashSaleProducts,
  type FlashSale,
} from '@/hooks/useFlashSales';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

const AdminFlashSalesPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const { data: flashSales, isLoading } = useAllFlashSales();
  const createMutation = useCreateFlashSale();
  const updateMutation = useUpdateFlashSale();
  const deleteMutation = useDeleteFlashSale();
  const toggleMutation = useToggleFlashSale();

  // Fetch products for selection
  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_id, name, price')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch products for editing sale
  const { data: saleProducts } = useFlashSaleProducts(editingSale?.id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      discount_type: 'percentage',
      discount_value: '',
      is_active: true,
    });
    setSelectedProducts([]);
    setEditingSale(null);
  };

  const handleEdit = (sale: FlashSale) => {
    setEditingSale(sale);
    setFormData({
      title: sale.title,
      description: sale.description || '',
      start_date: new Date(sale.start_date).toISOString().slice(0, 16),
      end_date: new Date(sale.end_date).toISOString().slice(0, 16),
      discount_type: sale.discount_type,
      discount_value: sale.discount_value.toString(),
      is_active: sale.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const saleData = {
      title: formData.title,
      description: formData.description || null,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      is_active: formData.is_active,
      display_order: 0,
    };

    if (editingSale) {
      await updateMutation.mutateAsync({
        id: editingSale.id,
        flashSale: saleData,
        productIds: selectedProducts,
      });
    } else {
      await createMutation.mutateAsync({
        flashSale: saleData,
        productIds: selectedProducts,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this flash sale?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleMutation.mutateAsync({ id, is_active: !isActive });
  };

  const isActive = (sale: FlashSale) => {
    const now = new Date();
    const start = new Date(sale.start_date);
    const end = new Date(sale.end_date);
    return sale.is_active && now >= start && now <= end;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Flash Sales</h1>
            <p className="text-muted-foreground">Manage time-limited promotional sales</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Flash Sale
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Flash Sales</CardTitle>
            <CardDescription>Create and manage flash sale events</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : flashSales && flashSales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flashSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {sale.discount_type === 'percentage'
                            ? `${sale.discount_value}%`
                            : `KES ${sale.discount_value}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(sale.start_date), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(sale.end_date), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {isActive(sale) ? (
                          <Badge className="bg-green-500">
                            <Zap className="h-3 w-3 mr-1" />
                            Live
                          </Badge>
                        ) : new Date(sale.end_date) < new Date() ? (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Ended
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={sale.is_active}
                          onCheckedChange={() => handleToggle(sale.id, sale.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(sale)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(sale.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No flash sales yet. Create your first flash sale!
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
              </DialogTitle>
              <DialogDescription>
                Set up a time-limited promotional sale with special pricing
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date & Time *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date & Time *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Discount Type *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed_amount') =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount (KES)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">Discount Value *</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Products *</Label>
                <ScrollArea className="h-[200px] border rounded-md p-4">
                  <div className="space-y-2">
                    {products?.map((product) => (
                      <div key={product.product_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={product.product_id}
                          checked={selectedProducts.includes(product.product_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts([...selectedProducts, product.product_id]);
                            } else {
                              setSelectedProducts(
                                selectedProducts.filter((id) => id !== product.product_id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={product.product_id}
                          className="text-sm cursor-pointer"
                        >
                          {product.name} - KES {product.price}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-sm text-muted-foreground">
                  {selectedProducts.length} product(s) selected
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSale ? 'Update' : 'Create'} Flash Sale
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminFlashSalesPage;