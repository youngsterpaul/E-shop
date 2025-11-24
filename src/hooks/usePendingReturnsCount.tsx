import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const usePendingReturnsCount = () => {
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ['pending-returns-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('returns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  // Real-time subscription for returns updates
  useEffect(() => {
    const channel = supabase
      .channel('pending-returns-count-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pending-returns-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return count;
};
