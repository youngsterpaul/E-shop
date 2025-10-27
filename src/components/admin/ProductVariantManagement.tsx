<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VariantValue {
  name: string;
  image_url: string; // ✅ always string now (no undefined)
}

interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: string;
  variant_value: VariantValue[];
  price_modifier: number;
  stock_quantity: number;
  sku_suffix?: string | null;
}

interface ProductVariantManagementProps {
  productId: string;
  productName: string;
}

const ProductVariantManagement = ({ productId }: ProductVariantManagementProps) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    variant_type: '',
    variant_values: [{ name: '', image_url: '' }],
    price_modifier: '0',
    stock_quantity: '0',
    sku_suffix: ''
  });

  const variantTypes = ['Color', 'Size', 'Material', 'Style', 'Storage', 'Capacity', 'Weight'];

  // 🔹 Fetch product variants
  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;

      const parsed = (data || []).map((v: any) => ({
        ...v,
        variant_value: Array.isArray(v.variant_value)
          ? v.variant_value.map((item: any) => ({
              name: item.name || '',
              image_url: item.image_url || '' // ✅ fallback ensures no undefined
            }))
          : [],
      }));

      setVariants(parsed);
    } catch (err) {
      console.error('Error fetching variants:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch product variants.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  // 🔹 Reset form
  const resetForm = () => {
    setFormData({
      variant_type: '',
      variant_values: [{ name: '', image_url: '' }],
      price_modifier: '0',
      stock_quantity: '0',
      sku_suffix: ''
    });
    setEditingVariant(null);
  };

  // 🔹 Handle variant value changes
  const handleVariantValueChange = (index: number, field: keyof VariantValue, value: string) => {
    const updated = [...formData.variant_values];
    updated[index][field] = value;
    setFormData({ ...formData, variant_values: updated });
  };

  const addVariantValue = () => {
    setFormData({
      ...formData,
      variant_values: [...formData.variant_values, { name: '', image_url: '' }]
    });
  };

  const removeVariantValue = (index: number) => {
    setFormData({
      ...formData,
      variant_values: formData.variant_values.filter((_, i) => i !== index)
    });
  };

  // 🔹 Handle Add / Update submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      product_id: productId,
      variant_type: formData.variant_type.trim(),
      variant_value: formData.variant_values
        .filter((v) => v.name.trim() !== '')
        .map((v) => ({
          name: v.name.trim(),
          image_url: v.image_url.trim() || ''
        })),
      price_modifier: parseFloat(formData.price_modifier) || 0,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      sku_suffix: formData.sku_suffix.trim() || null
    };

    try {
      if (editingVariant) {
        const { error } = await supabase
          .from('product_variants')
          .update(payload)
          .eq('id', editingVariant.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Variant updated successfully.' });
      } else {
        const { error } = await supabase.from('product_variants').insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Variant created successfully.' });
      }

      resetForm();
      setShowAddDialog(false);
      fetchVariants();
    } catch (err) {
      console.error('Error saving variant:', err);
      toast({
        title: 'Error',
        description: 'Failed to save variant.',
        variant: 'destructive'
      });
    }
  };

  // 🔹 Edit existing variant
  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      variant_type: variant.variant_type,
      variant_values: variant.variant_value.map((v) => ({
        name: v.name,
        image_url: v.image_url || ''
      })),
      price_modifier: variant.price_modifier.toString(),
      stock_quantity: variant.stock_quantity.toString(),
      sku_suffix: variant.sku_suffix || ''
    });
    setShowAddDialog(true);
  };

  // 🔹 Delete variant
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Variant deleted successfully.' });
      fetchVariants();
    } catch (err) {
      console.error('Error deleting variant:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete variant.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading variants...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Product Variants</CardTitle>
          <Dialog
            open={showAddDialog}
            onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={16} className="mr-2" />
                Add Variant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Variant Type */}
                <div>
                  <Label>Variant Type</Label>
                  <Select
                    value={formData.variant_type}
                    onValueChange={(value) => setFormData({ ...formData, variant_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select variant type" />
                    </SelectTrigger>
                    <SelectContent>
                      {variantTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Variant Values */}
                <div>
                  <Label>Variant Values</Label>
                  {formData.variant_values.map((value, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Input
                        placeholder="Name (e.g., Red, Large)"
                        value={value.name}
                        onChange={(e) => handleVariantValueChange(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Image URL"
                        value={value.image_url}
                        onChange={(e) => handleVariantValueChange(index, 'image_url', e.target.value)}
                      />
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariantValue(index)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariantValue}
                    className="mt-1"
                  >
                    <ImagePlus size={14} className="mr-2" />
                    Add Another
                  </Button>
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price Modifier (KES)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price_modifier}
                      onChange={(e) => setFormData({ ...formData, price_modifier: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>SKU Suffix (optional)</Label>
                  <Input
                    placeholder="-RED, -L, -64GB"
                    value={formData.sku_suffix}
                    onChange={(e) => setFormData({ ...formData, sku_suffix: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingVariant ? 'Update Variant' : 'Create Variant'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {variants.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No variants added yet.</p>
        ) : (
          <div className="space-y-2">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="p-3 border rounded-lg flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="font-medium">{variant.variant_type}</div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {variant.variant_value.map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {v.image_url && (
                          <img
                            src={v.image_url}
                            alt={v.name}
                            className="w-6 h-6 object-cover rounded"
                          />
                        )}
                        <span>{v.name}</span>
                      </div>
                    ))}
                    <div>
                      Price: {variant.price_modifier >= 0 ? '+' : ''}KES {variant.price_modifier} | Stock: {variant.stock_quantity}
                      {variant.sku_suffix && ` | SKU: ${variant.sku_suffix}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(variant)}>
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(variant.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductVariantManagement;
=======
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VariantValue {
  name: string;
  image_url: string; // ✅ always string now (no undefined)
}

interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: string;
  variant_value: VariantValue[];
  price_modifier: number;
  stock_quantity: number;
  sku_suffix?: string | null;
}

interface ProductVariantManagementProps {
  productId: string;
  productName: string;
}

const ProductVariantManagement = ({ productId }: ProductVariantManagementProps) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    variant_type: '',
    variant_values: [{ name: '', image_url: '' }],
    price_modifier: '0',
    stock_quantity: '0',
    sku_suffix: ''
  });

  const variantTypes = ['Color', 'Size', 'Material', 'Style', 'Storage', 'Capacity', 'Weight'];

  // 🔹 Fetch product variants
  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;

      const parsed = (data || []).map((v: any) => ({
        ...v,
        variant_value: Array.isArray(v.variant_value)
          ? v.variant_value.map((item: any) => ({
              name: item.name || '',
              image_url: item.image_url || '' // ✅ fallback ensures no undefined
            }))
          : [],
      }));

      setVariants(parsed);
    } catch (err) {
      console.error('Error fetching variants:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch product variants.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  // 🔹 Reset form
  const resetForm = () => {
    setFormData({
      variant_type: '',
      variant_values: [{ name: '', image_url: '' }],
      price_modifier: '0',
      stock_quantity: '0',
      sku_suffix: ''
    });
    setEditingVariant(null);
  };

  // 🔹 Handle variant value changes
  const handleVariantValueChange = (index: number, field: keyof VariantValue, value: string) => {
    const updated = [...formData.variant_values];
    updated[index][field] = value;
    setFormData({ ...formData, variant_values: updated });
  };

  const addVariantValue = () => {
    setFormData({
      ...formData,
      variant_values: [...formData.variant_values, { name: '', image_url: '' }]
    });
  };

  const removeVariantValue = (index: number) => {
    setFormData({
      ...formData,
      variant_values: formData.variant_values.filter((_, i) => i !== index)
    });
  };

  // 🔹 Handle Add / Update submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      product_id: productId,
      variant_type: formData.variant_type.trim(),
      variant_value: formData.variant_values
        .filter((v) => v.name.trim() !== '')
        .map((v) => ({
          name: v.name.trim(),
          image_url: v.image_url.trim() || ''
        })),
      price_modifier: parseFloat(formData.price_modifier) || 0,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      sku_suffix: formData.sku_suffix.trim() || null
    };

    try {
      if (editingVariant) {
        const { error } = await supabase
          .from('product_variants')
          .update(payload)
          .eq('id', editingVariant.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Variant updated successfully.' });
      } else {
        const { error } = await supabase.from('product_variants').insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Variant created successfully.' });
      }

      resetForm();
      setShowAddDialog(false);
      fetchVariants();
    } catch (err) {
      console.error('Error saving variant:', err);
      toast({
        title: 'Error',
        description: 'Failed to save variant.',
        variant: 'destructive'
      });
    }
  };

  // 🔹 Edit existing variant
  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      variant_type: variant.variant_type,
      variant_values: variant.variant_value.map((v) => ({
        name: v.name,
        image_url: v.image_url || ''
      })),
      price_modifier: variant.price_modifier.toString(),
      stock_quantity: variant.stock_quantity.toString(),
      sku_suffix: variant.sku_suffix || ''
    });
    setShowAddDialog(true);
  };

  // 🔹 Delete variant
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Variant deleted successfully.' });
      fetchVariants();
    } catch (err) {
      console.error('Error deleting variant:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete variant.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading variants...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Product Variants</CardTitle>
          <Dialog
            open={showAddDialog}
            onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={16} className="mr-2" />
                Add Variant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Variant Type */}
                <div>
                  <Label>Variant Type</Label>
                  <Select
                    value={formData.variant_type}
                    onValueChange={(value) => setFormData({ ...formData, variant_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select variant type" />
                    </SelectTrigger>
                    <SelectContent>
                      {variantTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Variant Values */}
                <div>
                  <Label>Variant Values</Label>
                  {formData.variant_values.map((value, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Input
                        placeholder="Name (e.g., Red, Large)"
                        value={value.name}
                        onChange={(e) => handleVariantValueChange(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Image URL"
                        value={value.image_url}
                        onChange={(e) => handleVariantValueChange(index, 'image_url', e.target.value)}
                      />
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariantValue(index)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariantValue}
                    className="mt-1"
                  >
                    <ImagePlus size={14} className="mr-2" />
                    Add Another
                  </Button>
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price Modifier (KES)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price_modifier}
                      onChange={(e) => setFormData({ ...formData, price_modifier: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>SKU Suffix (optional)</Label>
                  <Input
                    placeholder="-RED, -L, -64GB"
                    value={formData.sku_suffix}
                    onChange={(e) => setFormData({ ...formData, sku_suffix: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingVariant ? 'Update Variant' : 'Create Variant'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {variants.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No variants added yet.</p>
        ) : (
          <div className="space-y-2">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="p-3 border rounded-lg flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="font-medium">{variant.variant_type}</div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {variant.variant_value.map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {v.image_url && (
                          <img
                            src={v.image_url}
                            alt={v.name}
                            className="w-6 h-6 object-cover rounded"
                          />
                        )}
                        <span>{v.name}</span>
                      </div>
                    ))}
                    <div>
                      Price: {variant.price_modifier >= 0 ? '+' : ''}KES {variant.price_modifier} | Stock: {variant.stock_quantity}
                      {variant.sku_suffix && ` | SKU: ${variant.sku_suffix}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(variant)}>
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(variant.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductVariantManagement;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
