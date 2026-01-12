
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheCategories, getCachedCategories } from '@/utils/offlineStorage';

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
      // Check if online
      if (!navigator.onLine) {
        console.log('Offline: Using cached categories');
        const cachedCats = await getCachedCategories();
        const parentCats = cachedCats.filter(cat => !cat.parent_id);
        const formattedCategories = parentCats.map(cat => ({
          id: cat.id.toString(),
          name: cat.category,
          category: cat.category,
          parent_id: cat.parent_id?.toString() || null,
          subcategories: []
        }));
        setCategories(formattedCategories);
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('id, category, parent_id')
        .is('parent_id', null);
        
      if (error) throw error;
      
      if (data) {
        // Cache all categories for offline use
        cacheCategories(data).catch(err => {
          console.warn('Failed to cache categories:', err);
        });

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
      console.error('Error fetching categories, trying cache:', error);
      // Fallback to cache
      const cachedCats = await getCachedCategories();
      const parentCats = cachedCats.filter(cat => !cat.parent_id);
      const formattedCategories = parentCats.map(cat => ({
        id: cat.id.toString(),
        name: cat.category,
        category: cat.category,
        parent_id: cat.parent_id?.toString() || null,
        subcategories: []
      }));
      setCategories(formattedCategories);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      // Check if online
      if (!navigator.onLine) {
        console.log('Offline: Using cached subcategories');
        const cachedCats = await getCachedCategories();
        const subs = cachedCats.filter(cat => cat.parent_id?.toString() === categoryId);
        const formattedSubcategories = subs.map(sub => ({
          id: sub.id.toString(),
          name: sub.category,
          category: sub.category,
          parent_id: sub.parent_id?.toString() || ''
        }));
        setSubcategories(formattedSubcategories);
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('id, category, parent_id')
        .eq('parent_id', parseInt(categoryId));
        
      if (error) throw error;
      
      if (data) {
        // Cache subcategories
        cacheCategories(data).catch(err => {
          console.warn('Failed to cache subcategories:', err);
        });

        const formattedSubcategories = data.map(sub => ({
          id: sub.id.toString(),
          name: sub.category,
          category: sub.category,
          parent_id: sub.parent_id?.toString() || ''
        }));
        setSubcategories(formattedSubcategories);
      }
    } catch (error) {
      console.error('Error fetching subcategories, trying cache:', error);
      // Fallback to cache
      const cachedCats = await getCachedCategories();
      const subs = cachedCats.filter(cat => cat.parent_id?.toString() === categoryId);
      const formattedSubcategories = subs.map(sub => ({
        id: sub.id.toString(),
        name: sub.category,
        category: sub.category,
        parent_id: sub.parent_id?.toString() || ''
      }));
      setSubcategories(formattedSubcategories);
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
