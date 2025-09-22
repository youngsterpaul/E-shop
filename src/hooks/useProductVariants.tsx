
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductVariant {
  id: string;
  variant_type: string;
  variant_value: string;
  price_modifier: number;
  stock_quantity: number;
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
      
      // Transform the data to handle variant_value from database (JSONB) to string
      const transformedVariants: ProductVariant[] = [];
      
      data?.forEach(variant => {
        const variantValue = variant.variant_value;
        
        if (Array.isArray(variantValue)) {
          // Create individual variants for each value in the array
          variantValue.forEach((value: any) => {
            transformedVariants.push({
              id: variant.id,
              variant_type: variant.variant_type,
              variant_value: String(value),
              price_modifier: typeof variant.price_modifier === 'number' 
                ? variant.price_modifier 
                : Number(variant.price_modifier) || 0,
              stock_quantity: typeof variant.stock_quantity === 'number' 
                ? variant.stock_quantity 
                : Number(variant.stock_quantity) || 0
            });
          });
        } else {
          transformedVariants.push({
            id: variant.id,
            variant_type: variant.variant_type,
            variant_value: String(variantValue || ''),
            price_modifier: typeof variant.price_modifier === 'number' 
              ? variant.price_modifier 
              : Number(variant.price_modifier) || 0,
            stock_quantity: typeof variant.stock_quantity === 'number' 
              ? variant.stock_quantity 
              : Number(variant.stock_quantity) || 0
          });
        }
      });
      
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
