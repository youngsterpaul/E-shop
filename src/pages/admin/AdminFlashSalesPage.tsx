import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveModal, ResponsiveModalHeader, ResponsiveModalTitle, ResponsiveModalDescription } from '@/components/ui/responsive-modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Zap, Clock, ChevronLeft, ChevronRight, Copy, Power, PowerOff, Loader2, AlertTriangle } from 'lucide-react';
import { DebouncedSearchInput } from '@/components/admin/DebouncedSearchInput';
import {
  useAllFlashSales, useCreateFlashSale, useUpdateFlashSale,
  useDeleteFlashSale, useToggleFlashSale, useFlashSaleProducts,
  useFlashSaleProductCounts,
  type FlashSale,
} from '@/hooks/useFlashSales';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, addHours, isBefore } from 'date-fns';
import { FlashSaleSlotCreator } from '@/components/admin/FlashSaleSlotCreator';
import { getSlotStatus } from '@/utils/flashSaleSlots';
import { toast } from 'sonner';

interface ProductDiscount {
  product_id: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
}

const AdminFlashSalesPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [productDiscounts, setProductDiscounts] = useState<ProductDiscount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [tableFilter, setTableFilter] = useState<'all' | 'live' | 'upcoming' | 'ended'>('all');
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);
  const [defaultDiscountType, setDefaultDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [defaultDiscountValue, setDefaultDiscountValue] = useState('10');
  const pageSize = 10;

  const { data: flashSales, isLoading } = useAllFlashSales();
  const { data: productCounts } = useFlashSaleProductCounts();
  const createMutation = useCreateFlashSale();
  const updateMutation = useUpdateFlashSale();
  const deleteMutation = useDeleteFlashSale();
  const toggleMutation = useToggleFlashSale();

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-list', searchQuery, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase.from('products').select('product_id, name, price', { count: 'exact' }).order('name').range(from, to);
      if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,categories.ilike.%${searchQuery}%`);
      const { data, error, count } = await query;
      if (error) throw error;
      return { products: data || [], totalCount: count || 0 };
    },
  });

  const products = productsData?.products || [];
  const totalPages = Math.ceil((productsData?.totalCount || 0) / pageSize);
  const { data: saleProducts } = useFlashSaleProducts(editingSale?.id);

  const [formData, setFormData] = useState({
    title: '', description: '', start_date: '', end_date: '',
    is_active: true,
  });

  useEffect(() => {
    if (saleProducts && editingSale) {
      setProductDiscounts(saleProducts.map(p => ({
        product_id: p.product_id,
        discount_type: (p.discount_type as 'percentage' | 'fixed_amount') || editingSale.discount_type,
        discount_value: p.discount_value != null ? p.discount_value : editingSale.discount_value,
      })));
    }
  }, [saleProducts, editingSale]);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (isBefore(end, start)) {
        setDateError('End date must be after start date');
      } else if (end.getTime() === start.getTime()) {
        setDateError('Start and end dates cannot be the same');
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
  }, [formData.start_date, formData.end_date]);

  const resetForm = () => {
    setFormData({ title: '', description: '', start_date: '', end_date: '', is_active: true });
    setProductDiscounts([]);
    setEditingSale(null);
    setSearchQuery('');
    setCurrentPage(1);
    setDateError(null);
  };

  const toLocalDatetime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return isoStr.slice(0, 16);
    }
  };

  const handleEdit = (sale: FlashSale) => {
    setEditingSale(sale);
    setFormData({
      title: sale.title,
      description: sale.description || '',
      start_date: toLocalDatetime(sale.start_date),
      end_date: toLocalDatetime(sale.end_date),
      is_active: sale.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDuplicate = (sale: FlashSale) => {
    setEditingSale(null);
    setFormData({
      title: sale.title + ' (Copy)',
      description: sale.description || '',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    if (sale.id) {
      supabase.from('flash_sale_products').select('product_id, discount_type, discount_value').eq('flash_sale_id', sale.id)
        .then(({ data }) => {
          if (data) {
            setProductDiscounts(data.map((p: any) => ({
              product_id: p.product_id,
              discount_type: p.discount_type || sale.discount_type,
              discount_value: p.discount_value != null ? p.discount_value : sale.discount_value,
            })));
          }
        });
    }
    setIsDialogOpen(true);
  };

  const handleQuickCreate = async (slotData: {
    title: string; start_date: string; end_date: string;
    discount_type: 'percentage' | 'fixed_amount'; discount_value: number;
  }) => {
    setEditingSale(null);
    setFormData({
      title: slotData.title,
      description: '',
      start_date: toLocalDatetime(slotData.start_date),
      end_date: toLocalDatetime(slotData.end_date),
      is_active: true,
    });
    setDefaultDiscountType(slotData.discount_type);
    setDefaultDiscountValue(slotData.discount_value.toString());
    setProductDiscounts([]);
    setIsDialogOpen(true);
  };

  const addProductWithDiscount = (productId: string, checked: boolean) => {
    if (checked) {
      setProductDiscounts(prev => [...prev, {
        product_id: productId,
        discount_type: defaultDiscountType,
        discount_value: parseFloat(defaultDiscountValue) || 10,
      }]);
    } else {
      setProductDiscounts(prev => prev.filter(p => p.product_id !== productId));
    }
  };

  const updateProductDiscount = (productId: string, field: 'discount_type' | 'discount_value', value: any) => {
    setProductDiscounts(prev => prev.map(p =>
      p.product_id === productId
        ? { ...p, [field]: field === 'discount_value' ? parseFloat(value) || 0 : value }
        : p
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (dateError) {
      toast.error(dateError);
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('Please set both start and end dates');
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (isBefore(endDate, startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    // Use default discount at sale level as fallback
    const saleData = {
      title: formData.title,
      description: formData.description || null,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      discount_type: defaultDiscountType,
      discount_value: parseFloat(defaultDiscountValue) || 10,
      is_active: formData.is_active,
      display_order: 0,
    };

    if (editingSale) {
      await updateMutation.mutateAsync({ id: editingSale.id, flashSale: saleData, productDiscounts });
    } else {
      await createMutation.mutateAsync({ flashSale: saleData, productDiscounts });
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

  const handleSelectAllProducts = (checked: boolean) => {
    if (checked) {
      const newProducts = products
        .filter(p => !productDiscounts.some(pd => pd.product_id === p.product_id))
        .map(p => ({
          product_id: p.product_id,
          discount_type: defaultDiscountType,
          discount_value: parseFloat(defaultDiscountValue) || 10,
        }));
      setProductDiscounts(prev => [...prev, ...newProducts]);
    } else {
      const pageIds = products.map(p => p.product_id);
      setProductDiscounts(prev => prev.filter(p => !pageIds.includes(p.product_id)));
    }
  };

  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const handleBulkActivate = async (activate: boolean) => {
    if (bulkSelected.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await Promise.all(bulkSelected.map(id => toggleMutation.mutateAsync({ id, is_active: activate })));
      toast.success(`${bulkSelected.length} flash sale(s) ${activate ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Some operations failed');
    } finally {
      setBulkSelected([]);
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (bulkSelected.length === 0) return;
    if (!confirm(`Delete ${bulkSelected.length} flash sale(s)?`)) return;
    setIsBulkProcessing(true);
    try {
      await Promise.all(bulkSelected.map(id => deleteMutation.mutateAsync(id)));
      toast.success(`${bulkSelected.length} flash sale(s) deleted`);
    } catch {
      toast.error('Some deletions failed');
    } finally {
      setBulkSelected([]);
      setIsBulkProcessing(false);
    }
  };

  const applyDuration = (hours: number) => {
    if (!formData.start_date) {
      const now = new Date();
      const startStr = toLocalDatetime(now.toISOString());
      const endStr = toLocalDatetime(addHours(now, hours).toISOString());
      setFormData({ ...formData, start_date: startStr, end_date: endStr });
    } else {
      const start = new Date(formData.start_date);
      const endStr = toLocalDatetime(addHours(start, hours).toISOString());
      setFormData({ ...formData, end_date: endStr });
    }
  };

  const filteredSales = flashSales?.filter(sale => {
    if (tableFilter === 'all') return true;
    return getSlotStatus(sale) === tableFilter;
  }) || [];

  const liveCount = flashSales?.filter(s => getSlotStatus(s) === 'live').length || 0;
  const upcomingCount = flashSales?.filter(s => getSlotStatus(s) === 'upcoming').length || 0;

  const selectedProductIds = productDiscounts.map(p => p.product_id);
  const allPageProductsSelected = products.length > 0 && products.every(p => selectedProductIds.includes(p.product_id));

  const durationDisplay = formData.start_date && formData.end_date ? (() => {
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return null;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  })() : null;

  const applyDefaultToAll = () => {
    setProductDiscounts(prev => prev.map(p => ({
      ...p,
      discount_type: defaultDiscountType,
      discount_value: parseFloat(defaultDiscountValue) || 10,
    })));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Flash Sales</h1>
            <p className="text-muted-foreground">
              Manage 2-hour flash sale slots •{' '}
              <span className="text-green-600 font-medium">{liveCount} live</span> •{' '}
              <span className="text-blue-600 font-medium">{upcomingCount} upcoming</span>
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Flash Sale
          </Button>
        </div>

        <FlashSaleSlotCreator
          flashSales={flashSales || []}
          productCounts={productCounts}
          onQuickCreate={handleQuickCreate}
          onBatchCreate={async (slots) => {
            try {
              await Promise.all(slots.map(slot => createMutation.mutateAsync({
                flashSale: { ...slot, description: null, is_active: true, display_order: 0 },
                productDiscounts: []
              })));
              toast.success(`${slots.length} flash sale(s) created`);
            } catch {
              toast.error('Some creations failed');
            }
          }}
          onDuplicate={handleDuplicate}
          onEdit={handleEdit}
        />

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>All Flash Sales</CardTitle>
                <CardDescription>Manage all flash sale events</CardDescription>
              </div>
              <div className="flex gap-1">
                {(['all', 'live', 'upcoming', 'ended'] as const).map(f => (
                  <Button key={f} variant={tableFilter === f ? 'default' : 'outline'} size="sm" onClick={() => setTableFilter(f)} className="text-xs capitalize">
                    {f}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {bulkSelected.length > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-lg">
                <span className="text-sm font-medium">{bulkSelected.length} selected</span>
                <Button variant="outline" size="sm" onClick={() => handleBulkActivate(true)} disabled={isBulkProcessing}>
                  {isBulkProcessing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Power className="h-3 w-3 mr-1" />} Activate
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkActivate(false)} disabled={isBulkProcessing}>
                  {isBulkProcessing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <PowerOff className="h-3 w-3 mr-1" />} Deactivate
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isBulkProcessing}>
                  {isBulkProcessing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />} Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setBulkSelected([])}>Clear</Button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : filteredSales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filteredSales.length > 0 && filteredSales.every(s => bulkSelected.includes(s.id))}
                        onCheckedChange={(checked) => {
                          if (checked) setBulkSelected(filteredSales.map(s => s.id));
                          else setBulkSelected([]);
                        }}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Time Window</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => {
                    const status = getSlotStatus(sale);
                    const pCount = productCounts?.[sale.id] || 0;
                    return (
                      <TableRow key={sale.id} className={status === 'live' ? 'bg-green-50/50 dark:bg-green-950/10' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={bulkSelected.includes(sale.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setBulkSelected([...bulkSelected, sale.id]);
                              else setBulkSelected(bulkSelected.filter(id => id !== sale.id));
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{sale.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {pCount} product{pCount !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{format(new Date(sale.start_date), 'MMM dd, HH:mm')}</div>
                          <div className="text-muted-foreground">→ {format(new Date(sale.end_date), 'MMM dd, HH:mm')}</div>
                        </TableCell>
                        <TableCell>
                          {status === 'live' ? (
                            <Badge className="bg-green-500"><Zap className="h-3 w-3 mr-1" />Live</Badge>
                          ) : status === 'upcoming' ? (
                            <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>
                          ) : status === 'ended' ? (
                            <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ended</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch checked={sale.is_active} onCheckedChange={() => handleToggle(sale.id, sale.is_active)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDuplicate(sale)}><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(sale.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {tableFilter === 'all' ? 'No flash sales yet. Use the slot creator above!' : `No ${tableFilter} flash sales.`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <ResponsiveModal open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }} className="sm:max-w-3xl">
            <ResponsiveModalHeader>
              <ResponsiveModalTitle>{editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}</ResponsiveModalTitle>
              <ResponsiveModalDescription>Set up a time-limited promotional sale with per-product pricing</ResponsiveModalDescription>
            </ResponsiveModalHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} />
              </div>

              {/* Date/Time Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Schedule</Label>
                  {durationDisplay && (
                    <Badge variant="outline" className="text-xs">
                      Duration: {durationDisplay}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Label className="text-xs text-muted-foreground mr-1 self-center">Quick:</Label>
                  {[
                    { label: '1h', hours: 1 },
                    { label: '2h', hours: 2 },
                    { label: '4h', hours: 4 },
                    { label: '6h', hours: 6 },
                    { label: '12h', hours: 12 },
                    { label: '24h', hours: 24 },
                  ].map(({ label, hours }) => (
                    <Button key={label} type="button" variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={() => applyDuration(hours)}>
                      {label}
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="start_date" className="text-xs">Start Date & Time *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className={dateError ? 'border-destructive' : ''}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end_date" className="text-xs">End Date & Time *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      min={formData.start_date || undefined}
                      className={dateError ? 'border-destructive' : ''}
                    />
                  </div>
                </div>

                {dateError && (
                  <div className="flex items-center gap-1.5 text-destructive text-xs">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {dateError}
                  </div>
                )}

                {formData.start_date && formData.end_date && !dateError && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    📅 {format(new Date(formData.start_date), 'EEE, MMM dd yyyy, hh:mm a')} → {format(new Date(formData.end_date), 'EEE, MMM dd yyyy, hh:mm a')}
                  </div>
                )}
              </div>

              {/* Default discount for quick apply */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Default Discount (for new products)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={defaultDiscountValue}
                    onChange={e => setDefaultDiscountValue(e.target.value)}
                    className="w-24 h-9"
                    placeholder="Value"
                  />
                  <Select value={defaultDiscountType} onValueChange={(v: 'percentage' | 'fixed_amount') => setDefaultDiscountType(v)}>
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed_amount">Fixed (KES)</SelectItem>
                    </SelectContent>
                  </Select>
                  {productDiscounts.length > 0 && (
                    <Button type="button" variant="outline" size="sm" onClick={applyDefaultToAll} className="text-xs whitespace-nowrap">
                      Apply to all ({productDiscounts.length})
                    </Button>
                  )}
                </div>
              </div>

              {/* Products with individual discounts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Products & Discounts</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all-products"
                      checked={allPageProductsSelected}
                      onCheckedChange={handleSelectAllProducts}
                    />
                    <label htmlFor="select-all-products" className="text-xs text-muted-foreground cursor-pointer">
                      Select all on page
                    </label>
                  </div>
                </div>
                <DebouncedSearchInput value={searchQuery} onChange={v => { setSearchQuery(v); setCurrentPage(1); }} placeholder="Search products..." className="mb-2" />
                <ScrollArea className="h-[280px] border rounded-md p-3">
                  {isLoadingProducts ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">Loading products...</div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">No products found</div>
                  ) : (
                    <div className="space-y-2">
                      {products.map(product => {
                        const isSelected = selectedProductIds.includes(product.product_id);
                        const discount = productDiscounts.find(p => p.product_id === product.product_id);
                        return (
                          <div key={product.product_id} className={`flex items-center gap-2 p-2 rounded-md transition-colors overflow-hidden ${isSelected ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'}`}>
                            <Checkbox
                              id={product.product_id}
                              checked={isSelected}
                              onCheckedChange={checked => addProductWithDiscount(product.product_id, !!checked)}
                            />
                            <label htmlFor={product.product_id} className="text-sm cursor-pointer flex-1 min-w-0 truncate">
                              {product.name.split(' ').slice(0, 6).join(' ')}… 
                              <span className="text-muted-foreground">- KES {product.price}</span>
                            </label>
                            {isSelected && discount && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={discount.discount_value}
                                  onChange={e => updateProductDiscount(product.product_id, 'discount_value', e.target.value)}
                                  className="w-32 h-7 text-xs"
                                />
                                <Select value={discount.discount_type} onValueChange={(v: 'percentage' | 'fixed_amount') => updateProductDiscount(product.product_id, 'discount_type', v)}>
                                  <SelectTrigger className="w-16 h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percentage">%</SelectItem>
                                    <SelectItem value="fixed_amount">KES</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{productDiscounts.length} product(s) selected</span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={checked => setFormData({ ...formData, is_active: checked })} />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={!!dateError}>
                  {editingSale ? 'Update' : 'Create'} Flash Sale
                </Button>
              </div>
            </form>
        </ResponsiveModal>
      </div>
    </AdminLayout>
  );
};

export default AdminFlashSalesPage;
