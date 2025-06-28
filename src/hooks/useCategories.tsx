
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  category: string;
  parent_id: string | null;
  description?: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  category: string;
  parent_id: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, category, parent_id')
        .is('parent_id', null);
        
      if (error) throw error;
      
      if (data) {
        const formattedCategories = data.map(cat => ({
          id: cat.id.toString(),
          name: cat.category,
          category: cat.category,
          parent_id: cat.parent_id?.toString() || null,
          subcategories: []
        }));
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, category, parent_id')
        .eq('parent_id', parseInt(categoryId));
        
      if (error) throw error;
      
      if (data) {
        const formattedSubcategories = data.map(sub => ({
          id: sub.id.toString(),
          name: sub.category,
          category: sub.category,
          parent_id: sub.parent_id.toString()
        }));
        setSubcategories(formattedSubcategories);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    subcategories,
    setSubcategories,
    fetchSubcategories
  };
};
