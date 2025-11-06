
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductVariant {
  id: string;
  variant_type: string;
  variant_value: string;
  price_modifier: number;
  stock_quantity: number;
  image_url?: string | null;
}

export const useProductVariants = (productId: string) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVariants = async () => {
    if (!productId) return;

    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('variant_type')
        .order('variant_value');

      if (error) throw error;
      
      // Data is already in the correct format - one row per variant value
      const transformedVariants: ProductVariant[] = (data || []).map(variant => ({
        id: variant.id,
        variant_type: variant.variant_type,
        variant_value: String(variant.variant_value || ''),
        price_modifier: typeof variant.price_modifier === 'number' 
          ? variant.price_modifier 
          : Number(variant.price_modifier) || 0,
        stock_quantity: typeof variant.stock_quantity === 'number' 
          ? variant.stock_quantity 
          : Number(variant.stock_quantity) || 0,
        image_url: variant.image_url || null
      }));
      
      setVariants(transformedVariants);
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const getVariantsByType = (type: string) => {
    return variants.filter(v => v.variant_type === type);
  };

  const getVariantTypes = () => {
    return [...new Set(variants.map(v => v.variant_type))];
  };

  return {
    variants,
    loading,
    getVariantsByType,
    getVariantTypes,
    refetch: fetchVariants
  };
};
