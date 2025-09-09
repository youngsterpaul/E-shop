
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Brand {
  id: string;
  name: string;
  subcategory_id: number;
  logo_url?: string;
  description?: string;
  is_active: boolean;
}

export const useBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrandsBySubcategory = async (subcategoryName: string) => {
    if (!subcategoryName) {
      setBrands([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get the subcategory ID
      const { data: subcategoryData, error: subcategoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('category', subcategoryName)
        .single();

      if (subcategoryError) throw subcategoryError;

      // Then fetch brands for that subcategory
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .eq('subcategory_id', subcategoryData.id)
        .eq('is_active', true)
        .order('name');

      if (brandsError) throw brandsError;

      setBrands((brandsData || []).map(brand => ({
        ...brand,
        subcategory_id: brand.subcategory_id || 0,
        category_id: brand.category_id || 0,
        is_active: brand.is_active ?? true,
        created_at: brand.created_at || '',
        updated_at: brand.updated_at || '',
        description: brand.description || '',
        logo_url: brand.logo_url || ''
      })));
    } catch (err: any) {
      setError(err.message);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandsByCategory = async (categoryName: string) => {
    if (!categoryName) {
      setBrands([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all subcategories for this category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('category', categoryName)
        .is('parent_id', null)
        .single();

      if (categoryError) throw categoryError;

      // Get subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', categoryData.id);

      if (subcategoriesError) throw subcategoriesError;

      if (!subcategoriesData || subcategoriesData.length === 0) {
        setBrands([]);
        return;
      }

      const subcategoryIds = subcategoriesData.map(sub => sub.id);

      // Then fetch brands for all subcategories of this category
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .in('subcategory_id', subcategoryIds)
        .eq('is_active', true)
        .order('name');

      if (brandsError) throw brandsError;

      setBrands((brandsData || []).map(brand => ({
        ...brand,
        subcategory_id: brand.subcategory_id || 0,
        category_id: brand.category_id || 0,
        is_active: brand.is_active ?? true,
        created_at: brand.created_at || '',
        updated_at: brand.updated_at || '',
        description: brand.description || '',
        logo_url: brand.logo_url || ''
      })));
    } catch (err: any) {
      setError(err.message);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBrands = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setBrands((data || []).map(brand => ({
        ...brand,
        subcategory_id: brand.subcategory_id || 0,
        category_id: brand.category_id || 0,
        is_active: brand.is_active ?? true,
        created_at: brand.created_at || '',
        updated_at: brand.updated_at || '',
        description: brand.description || '',
        logo_url: brand.logo_url || ''
      })));
    } catch (err: any) {
      setError(err.message);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    brands,
    loading,
    error,
    fetchBrandsByCategory,
    fetchBrandsBySubcategory,
    fetchAllBrands
  };
};
