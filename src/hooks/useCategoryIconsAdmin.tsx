import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CategoryIconAdmin {
  id: number;
  name: string;
  icon_name: string;
  category_id: number | null;
  subcategory_id: number | null;
  color: string;
  icon_color: string;
  product_image: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCategoryIconsAdmin = () => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all category icons (including inactive)
  const { data: categoryIcons = [], isLoading } = useQuery({
    queryKey: ['admin-category-icons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_icons')
        .select(`
          *,
          category:categories!category_icons_category_id_fkey(id, category, slug),
          subcategory:categories!category_icons_subcategory_id_fkey(id, category, slug)
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch categories for the form
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category');

      if (error) throw error;
      return data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (iconData: Omit<CategoryIconAdmin, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('category_icons')
        .insert(iconData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-category-icons'] });
      queryClient.invalidateQueries({ queryKey: ['categoryIcons'] });
      toast({
        title: "Success",
        description: "Category icon created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category icon",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...iconData }: Partial<CategoryIconAdmin> & { id: number }) => {
      const { data, error } = await supabase
        .from('category_icons')
        .update(iconData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-category-icons'] });
      queryClient.invalidateQueries({ queryKey: ['categoryIcons'] });
      toast({
        title: "Success",
        description: "Category icon updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category icon",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('category_icons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-category-icons'] });
      queryClient.invalidateQueries({ queryKey: ['categoryIcons'] });
      toast({
        title: "Success",
        description: "Category icon deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category icon",
        variant: "destructive",
      });
    },
  });

  const handleCreate = async (iconData: Omit<CategoryIconAdmin, 'id' | 'created_at' | 'updated_at'>) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(iconData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number, iconData: Partial<CategoryIconAdmin>) => {
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync({ id, ...iconData });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsSubmitting(true);
    try {
      await deleteMutation.mutateAsync(id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    categoryIcons,
    categories,
    isLoading,
    isSubmitting,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
};
