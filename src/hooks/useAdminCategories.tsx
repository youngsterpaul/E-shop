
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: number;
  category: string;
  parent_id: number | null;
}

export const useAdminCategories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (name: string, parentId: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('categories')
        .insert({
          category: name,
          parent_id: parentId && parentId !== 'none' ? parseInt(parentId) : null
        } as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category added successfully"
      });

      fetchCategories();
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async (id: number, name: string, parentId: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('categories')
        .update({
          category: name,
          parent_id: parentId && parentId !== 'none' ? parseInt(parentId) : null
        } as any)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully"
      });

      fetchCategories();
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      // Check if category has subcategories
      const hasSubcategories = categories.some(cat => cat.parent_id === categoryId);
      if (hasSubcategories) {
        toast({
          title: "Cannot delete",
          description: "Please delete all subcategories first",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully"
      });

      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const mainCategories = categories.filter(cat => cat.parent_id === null);
  const getSubcategories = (parentId: number) => 
    categories.filter(cat => cat.parent_id === parentId);

  return {
    categories,
    loading,
    isSubmitting,
    mainCategories,
    getSubcategories,
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory
  };
};
