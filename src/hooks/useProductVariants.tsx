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

  useEffect(() => {
    const fetchVariants = async () => {
      // ✅ FIX: Always set loading to false, even if productId is empty
      if (!productId) {
        setVariants([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .order('variant_type')
          .order('variant_value');

        if (error) throw error;
        
        // Handle JSONB columns - extract actual values
        const transformedVariants: ProductVariant[] = (data || []).map(variant => {
          // JSONB columns return the actual value, not wrapped in object
          const variantValue = typeof variant.variant_value === 'object' && variant.variant_value !== null
            ? JSON.stringify(variant.variant_value)
            : String(variant.variant_value || '');
          
          const priceModifier = typeof variant.price_modifier === 'object' && variant.price_modifier !== null
            ? Number(Object.values(variant.price_modifier)[0]) || 0
            : Number(variant.price_modifier) || 0;
          
          const stockQuantity = typeof variant.stock_quantity === 'object' && variant.stock_quantity !== null
            ? Number(Object.values(variant.stock_quantity)[0]) || 0
            : Number(variant.stock_quantity) || 0;

          return {
            id: variant.id,
            variant_type: variant.variant_type,
            variant_value: variantValue,
            price_modifier: priceModifier,
            stock_quantity: stockQuantity,
            image_url: variant.image_url || null
          };
        });
        
        setVariants(transformedVariants);
      } catch (error) {
        console.error('Error fetching variants:', error);
        setVariants([]);
      } finally {
        setLoading(false);
      }
    };

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
    refetch: () => {} // Return a no-op function for consistency
  };
};