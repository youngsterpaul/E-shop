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

      // Parse the JSON value - it can be stored as JSON object with searches array or direct array
      const settingValue = data?.setting_value;
      
      if (!settingValue) return [];
      
      // If it's already an array, return it
      if (Array.isArray(settingValue)) {
        return settingValue as string[];
      }
      
      // If it's an object with searches property
      if (typeof settingValue === 'object' && 'searches' in settingValue) {
        return (settingValue as { searches: string[] }).searches || [];
      }
      
      return [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};
