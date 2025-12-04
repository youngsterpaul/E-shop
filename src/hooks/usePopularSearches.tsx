import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePopularSearches = () => {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'popular_searches')
        .single();

      if (error) {
        console.error('Error fetching popular searches:', error);
        return [];
      }

      // Parse the JSON array from setting_value
      const searches = data?.setting_value as string[] | null;
      return searches || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};
