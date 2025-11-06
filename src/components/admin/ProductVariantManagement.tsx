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

interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: string;
  variant_value: string; // Single value per row
  price_modifier: number;
  stock_quantity: number;
  image_url?: string | null;
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
    variant_value: '',
    price_modifier: '0',
    stock_quantity: '0',
    image_url: '',
    sku_suffix: ''
  });

  const variantTypes = ['Color', 'Size', 'Material', 'Style', 'Storage', 'Capacity', 'Weight'];

  // 🔹 Fetch product variants
  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('variant_type')
        .order('variant_value');

      if (error) throw error;
      
      // Transform data to match ProductVariant interface
      const transformedData: ProductVariant[] = (data || []).map(variant => ({
        id: variant.id,
        product_id: variant.product_id || '',
        variant_type: variant.variant_type,
        variant_value: String(variant.variant_value || ''),
        price_modifier: typeof variant.price_modifier === 'number' 
          ? variant.price_modifier 
          : Number(variant.price_modifier) || 0,
        stock_quantity: typeof variant.stock_quantity === 'number' 
          ? variant.stock_quantity 
          : Number(variant.stock_quantity) || 0,
        image_url: variant.image_url,
        sku_suffix: variant.sku_suffix
      }));
      
      setVariants(transformedData);
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
      variant_value: '',
      price_modifier: '0',
      stock_quantity: '0',
      image_url: '',
      sku_suffix: ''
    });
    setEditingVariant(null);
  };

  // 🔹 Handle Add / Update submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.variant_type.trim() || !formData.variant_value.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in variant type and value.',
        variant: 'destructive'
      });
      return;
    }

    const payload = {
      product_id: productId,
      variant_type: formData.variant_type.trim(),
      variant_value: formData.variant_value.trim(),
      price_modifier: parseFloat(formData.price_modifier) || 0,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      image_url: formData.image_url.trim() || null,
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
      variant_value: String(variant.variant_value),
      price_modifier: variant.price_modifier.toString(),
      stock_quantity: variant.stock_quantity.toString(),
      image_url: variant.image_url || '',
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

                {/* Variant Value */}
                <div>
                  <Label>Variant Value</Label>
                  <Input
                    placeholder="e.g., Red, Large, 4GB+128GB"
                    value={formData.variant_value}
                    onChange={(e) => setFormData({ ...formData, variant_value: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter one value per variant</p>
                </div>

                {/* Image URL */}
                <div>
                  <Label>Image URL (optional)</Label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
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
                    <p className="text-xs text-gray-500 mt-1">Additional cost for this variant</p>
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
                className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  {variant.image_url && (
                    <img
                      src={variant.image_url}
                      alt={String(variant.variant_value)}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {variant.variant_type}: <span className="text-primary">{variant.variant_value}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Price: {variant.price_modifier >= 0 ? '+' : ''}KES {variant.price_modifier.toFixed(2)} | 
                      Stock: {variant.stock_quantity}
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
