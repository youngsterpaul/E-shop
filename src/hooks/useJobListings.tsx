import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  experience: string;
  type: string;
  salary_range: string | null;
  responsibilities: string[];
  requirements: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useJobListings = (activeOnly = true) => {
  const queryClient = useQueryClient();

  const query = useQuery<JobListing[]>({
    queryKey: ['jobListings', activeOnly],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('job_listings')
        .select('*')
        .order('display_order', { ascending: true });

      if (activeOnly) {
        queryBuilder = queryBuilder.eq('is_active', true);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data as JobListing[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: async (job: Omit<JobListing, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('job_listings')
        .insert(job)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobListings'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JobListing> & { id: string }) => {
      const { data, error } = await supabase
        .from('job_listings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobListings'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_listings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobListings'] });
    },
  });

  return {
    jobs: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createJob: createMutation.mutateAsync,
    updateJob: updateMutation.mutateAsync,
    deleteJob: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
