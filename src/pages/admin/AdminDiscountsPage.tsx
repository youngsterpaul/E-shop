import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Tag, TrendingDown, Users, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Discount {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  applies_to: 'all' | 'specific_products' | 'specific_categories';
  created_at: string;
}

export default function AdminDiscountsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 0,
    min_purchase_amount: 0,
    max_discount_amount: null as number | null,
    usage_limit: null as number | null,
    per_user_limit: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
    applies_to: 'all' as 'all' | 'specific_products' | 'specific_categories',
  });

  // Fetch discounts
  const { data: discounts = [], isLoading } = useQuery({
    queryKey: ['admin-discounts', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('discounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('code', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Discount[];
    }
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['admin-discounts-analytics'],
    queryFn: async () => {
      const { data: allDiscounts } = await supabase.from('discounts').select('usage_count, discount_type');
      const { data: usageData } = await supabase
        .from('discount_usage')
        .select('discount_amount');

      const totalDiscounts = allDiscounts?.length || 0;
      const activeDiscounts = discounts.filter(d => d.is_active).length;
      const totalSavings = usageData?.reduce((sum, u) => sum + Number(u.discount_amount), 0) || 0;
      const totalUses = allDiscounts?.reduce((sum, d) => sum + (d.usage_count || 0), 0) || 0;

      return { totalDiscounts, activeDiscounts, totalSavings, totalUses };
    }
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        ...data,
        end_date: data.end_date || null,
        max_discount_amount: data.max_discount_amount || null,
        usage_limit: data.usage_limit || null,
      };

      if (editingDiscount) {
        const { error } = await supabase
          .from('discounts')
          .update(payload)
          .eq('id', editingDiscount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('discounts')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-discounts-analytics'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(editingDiscount ? 'Discount updated' : 'Discount created');
    },
    onError: (error: any) => {
      toast.error('Failed: ' + error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-discounts-analytics'] });
      toast.success('Discount deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('discounts')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      toast.success('Discount status updated');
    }
  });

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_purchase_amount: 0,
      max_discount_amount: null,
      usage_limit: null,
      per_user_limit: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: true,
      applies_to: 'all',
    });
    setEditingDiscount(null);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      description: discount.description || '',
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      min_purchase_amount: discount.min_purchase_amount,
      max_discount_amount: discount.max_discount_amount,
      usage_limit: discount.usage_limit,
      per_user_limit: discount.per_user_limit,
      start_date: discount.start_date.split('T')[0],
      end_date: discount.end_date ? discount.end_date.split('T')[0] : '',
      is_active: discount.is_active,
      applies_to: discount.applies_to,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Discounts & Coupons</h1>
            <p className="text-muted-foreground mt-1">Manage promotional codes and offers</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Discount
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingDiscount ? 'Edit Discount' : 'Create Discount'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Discount Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER2024"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_type">Type *</Label>
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
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Summer sale - 20% off all items"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount_value">
                      {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount (KSH)'} *
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_purchase_amount">Min Purchase (KSH)</Label>
                    <Input
                      id="min_purchase_amount"
                      type="number"
                      value={formData.min_purchase_amount}
                      onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_discount_amount">Max Discount Amount (KSH)</Label>
                    <Input
                      id="max_discount_amount"
                      type="number"
                      value={formData.max_discount_amount || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        max_discount_amount: e.target.value ? parseFloat(e.target.value) : null
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="per_user_limit">Uses Per User</Label>
                    <Input
                      id="per_user_limit"
                      type="number"
                      value={formData.per_user_limit}
                      onChange={(e) => setFormData({ ...formData, per_user_limit: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="usage_limit">Total Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      usage_limit: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="Leave empty for unlimited"
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

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : editingDiscount ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalDiscounts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeDiscounts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KSH {analytics.totalSavings.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Discounts Table */}
        <Card>
          <CardHeader>
            <Input
              placeholder="Search by code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : discounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No discounts found</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-bold">{discount.code}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCode(discount.code)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {discount.description && (
                            <p className="text-xs text-muted-foreground mt-1">{discount.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {discount.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {discount.discount_type === 'percentage'
                            ? `${discount.discount_value}%`
                            : `KSH ${discount.discount_value}`}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{discount.usage_count} uses</div>
                            {discount.usage_limit && (
                              <div className="text-xs text-muted-foreground">
                                Limit: {discount.usage_limit}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{format(new Date(discount.start_date), 'MMM dd, yyyy')}</div>
                          {discount.end_date && (
                            <div className="text-xs text-muted-foreground">
                              to {format(new Date(discount.end_date), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={discount.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: discount.id, is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(discount)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Delete this discount?')) {
                                  deleteMutation.mutate(discount.id);
                                }
                              }}
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
    </AdminLayout>
  );
}
