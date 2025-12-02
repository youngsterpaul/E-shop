import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useFAQ = () => {
  const queryClient = useQueryClient();

  const { data: faqItems = [], isLoading } = useQuery({
    queryKey: ['faq-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as FAQItem[];
    },
  });

  const createFAQ = useMutation({
    mutationFn: async (faq: Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('faq_items')
        .insert(faq)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] });
      toast.success('FAQ created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create FAQ: ' + error.message);
    },
  });

  const updateFAQ = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FAQItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('faq_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] });
      toast.success('FAQ updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update FAQ: ' + error.message);
    },
  });

  const deleteFAQ = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] });
      toast.success('FAQ deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete FAQ: ' + error.message);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('faq_items')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] });
      toast.success('FAQ status updated');
    },
    onError: (error) => {
      toast.error('Failed to update FAQ status: ' + error.message);
    },
  });

  // Group FAQs by category
  const faqByCategory = faqItems
    .filter(faq => faq.is_active)
    .reduce((acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {} as Record<string, FAQItem[]>);

  return {
    faqItems,
    faqByCategory,
    isLoading,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    toggleActive,
  };
};
