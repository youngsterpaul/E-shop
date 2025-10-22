import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
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
  image_url: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: string;
  variant_value: VariantValue[];
  price_modifier: number;
  stock_quantity: number;
  sku_suffix?: string;
}

interface ProductVariantManagementProps {
  productId: string;
  productName: string;
}

const ProductVariantManagement = ({ productId, productName }: ProductVariantManagementProps) => {
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

  const variantTypes = ['Size', 'Color', 'Material', 'Style', 'Storage', 'Capacity', 'Weight'];

  // 🧠 Fetch product variants from Supabase
  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('variant_type', { ascending: true });

      if (error) throw error;

      const transformed = data?.map((v: any) => ({
        ...v,
        variant_value: Array.isArray(v.variant_value)
          ? v.variant_value
          : typeof v.variant_value === 'string'
          ? JSON.parse(v.variant_value)
          : []
      })) as ProductVariant[];

      setVariants(transformed || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch product variants',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  // 🧩 Handle Save / Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanValues = formData.variant_values.filter(v => v.name.trim() !== '');

    const variantData = {
      product_id: productId,
      variant_type: formData.variant_type,
      variant_value: cleanValues,
      price_modifier: parseFloat(formData.price_modifier),
      stock_quantity: parseInt(formData.stock_quantity),
      sku_suffix: formData.sku_suffix || null
    };

    try {
      if (editingVariant) {
        const { error } = await supabase
          .from('product_variants')
          .update(variantData)
          .eq('id', editingVariant.id);

        if (error) throw error;
        toast({ title: 'Updated', description: 'Variant updated successfully' });
      } else {
        const { error } = await supabase
          .from('product_variants')
          .insert([variantData]);

        if (error) throw error;
        toast({ title: 'Created', description: 'Variant created successfully' });
      }

      resetForm();
      setShowAddDialog(false);
      fetchVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast({
        title: 'Error',
        description: 'Failed to save variant',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      variant_type: variant.variant_type,
      variant_values: variant.variant_value || [{ name: '', image_url: '' }],
      price_modifier: variant.price_modifier.toString(),
      stock_quantity: variant.stock_quantity.toString(),
      sku_suffix: variant.sku_suffix || ''
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;
      toast({ title: 'Deleted', description: 'Variant deleted successfully' });
      fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete variant',
        variant: 'destructive'
      });
    }
  };

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

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading variants...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
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
                      <SelectValue placeholder="Select type" />
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
                  {formData.variant_values.map((value, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Input
                        placeholder="Name (e.g., Red)"
                        value={value.name}
                        onChange={(e) => {
                          const newValues = [...formData.variant_values];
                          newValues[idx].name = e.target.value;
                          setFormData({ ...formData, variant_values: newValues });
                        }}
                      />
                      <Input
                        placeholder="Image URL (optional)"
                        value={value.image_url || ''}
                        onChange={(e) => {
                          const newValues = [...formData.variant_values];
                          newValues[idx].image_url = e.target.value;
                          setFormData({ ...formData, variant_values: newValues });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          const newValues = formData.variant_values.filter((_, i) => i !== idx);
                          setFormData({ ...formData, variant_values: newValues });
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        variant_values: [...formData.variant_values, { name: '', image_url: '' }]
                      })
                    }
                  >
                    + Add Value
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

                {/* SKU */}
                <div>
                  <Label>SKU Suffix (optional)</Label>
                  <Input
                    value={formData.sku_suffix}
                    onChange={(e) => setFormData({ ...formData, sku_suffix: e.target.value })}
                    placeholder="e.g., -RED, -XL"
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

      {/* Variant List */}
      <CardContent>
        {variants.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No variants added yet</p>
        ) : (
          <div className="space-y-3">
            {variants.map((variant) => (
              <div key={variant.id} className="flex justify-between items-start p-3 border rounded-md">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{variant.variant_type}</h4>
                  <div className="flex flex-wrap gap-2">
                    {variant.variant_value.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 border rounded px-2 py-1">
                        {v.image_url && (
                          <img
                            src={v.image_url}
                            alt={v.name}
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                        <span className="text-sm">{v.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Price: {variant.price_modifier >= 0 ? '+' : ''}KES {variant.price_modifier} | Stock:{' '}
                    {variant.stock_quantity}
                    {variant.sku_suffix && ` | SKU: ${variant.sku_suffix}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(variant)}>
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDelete(variant.id)}
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
