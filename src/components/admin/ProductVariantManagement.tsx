import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
  variant_value: string;
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
    variant_value: '',
    price_modifier: '0',
    stock_quantity: '0',
    sku_suffix: ''
  });

  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('variant_type')
        .order('variant_value');

      if (error) throw error;
      
      // Transform the data to match our interface, properly handling the JSONB variant_value
      const transformedVariants: ProductVariant[] = data?.map(variant => ({
        id: variant.id,
        product_id: variant.product_id || '',
        variant_type: variant.variant_type,
        variant_value: Array.isArray(variant.variant_value) 
          ? variant.variant_value.join('\n') 
          : String(variant.variant_value || ''),
        price_modifier: typeof variant.price_modifier === 'number' 
          ? variant.price_modifier 
          : Number(variant.price_modifier) || 0,
        stock_quantity: typeof variant.stock_quantity === 'number' 
          ? variant.stock_quantity 
          : Number(variant.stock_quantity) || 0,
        sku_suffix: variant.sku_suffix || undefined
      })) || [];
      
      setVariants(transformedVariants);
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast({
        title: "Error",
        description: "Failed to fetch product variants",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store variant values with line breaks in JSONB format
    const variantValues = formData.variant_value.split('\n').map(v => v.trim()).filter(v => v);
    
    const variantData = {
      product_id: productId,
      variant_type: formData.variant_type,
      variant_value: variantValues, // Store as array with line breaks preserved
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
        toast({ title: "Success", description: "Variant updated successfully" });
      } else {
        const { error } = await supabase
          .from('product_variants')
          .insert([variantData]);

        if (error) throw error;
        toast({ title: "Success", description: "Variant created successfully" });
      }

      setFormData({ variant_type: '', variant_value: '', price_modifier: '0', stock_quantity: '0', sku_suffix: '' });
      setEditingVariant(null);
      setShowAddDialog(false);
      fetchVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast({
        title: "Error",
        description: "Failed to save variant",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      variant_type: variant.variant_type,
      variant_value: variant.variant_value,
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
      toast({ title: "Success", description: "Variant deleted successfully" });
      fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: "Error",
        description: "Failed to delete variant",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({ variant_type: '', variant_value: '', price_modifier: '0', stock_quantity: '0', sku_suffix: '' });
    setEditingVariant(null);
  };

  const variantTypes = ['Size', 'Color', 'Material', 'Style', 'Capacity', 'Weight'];

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading variants...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Variants</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={16} className="mr-2" />
                Add Variant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="variant_type">Variant Type</Label>
                  <Select
                    value={formData.variant_type}
                    onValueChange={(value) => setFormData({ ...formData, variant_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select variant type" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Size', 'Color', 'Material', 'Style', 'Capacity', 'Weight'].map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="variant_value">Variant Values (one per line)</Label>
                  <textarea
                    id="variant_value"
                    value={formData.variant_value}
                    onChange={(e) => setFormData({ ...formData, variant_value: e.target.value })}
                    placeholder="e.g.:\nSmall\nMedium\nLarge"
                    className="w-full p-2 border rounded-md min-h-[80px]"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter each variant value on a new line
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_modifier">Price Modifier (KES)</Label>
                    <Input
                      id="price_modifier"
                      type="number"
                      step="0.01"
                      value={formData.price_modifier}
                      onChange={(e) => setFormData({ ...formData, price_modifier: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock_quantity">Stock Quantity</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sku_suffix">SKU Suffix (optional)</Label>
                  <Input
                    id="sku_suffix"
                    value={formData.sku_suffix}
                    onChange={(e) => setFormData({ ...formData, sku_suffix: e.target.value })}
                    placeholder="e.g., -32, -RED, -LG"
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
          <p className="text-gray-500 text-center py-4">No variants added yet</p>
        ) : (
          <div className="space-y-2">
            {variants.map((variant) => (
              <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">
                    {variant.variant_type}: {variant.variant_value.replace(/\n/g, ', ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    Price: {variant.price_modifier >= 0 ? '+' : ''}KES {variant.price_modifier} | 
                    Stock: {variant.stock_quantity}
                    {variant.sku_suffix && ` | SKU: ${variant.sku_suffix}`}
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
