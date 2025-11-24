import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useSecurityAlertsCount = () => {
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ['security-alerts-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('security_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('acknowledged', false);
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });

  // Set up real-time subscription for count updates
  useEffect(() => {
    const channel = supabase
      .channel('security-alerts-count-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_alerts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['security-alerts-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return count;
};
