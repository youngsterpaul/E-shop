import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ShippingSettings {
  shippingFee: number;
  freeShippingThreshold: number;
}

export const useShippingSettings = () => {
  const query = useQuery<ShippingSettings>({
    queryKey: ['shippingSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['shipping_fee', 'free_shipping_threshold']);

      if (error) throw new Error(error.message);

      // Normalize and parse
      const settingsMap: Record<string, any> = {};
      for (const item of data ?? []) {
        settingsMap[item.setting_key] = item.setting_value;
      }

      // Convert to numbers with fallback defaults
      const shippingFee = Number(settingsMap['shipping_fee'] ?? 0);
      const freeShippingThreshold = (settingsMap['free_shipping_threshold']);

      return { shippingFee, freeShippingThreshold };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    shippingFee: query.data?.shippingFee ?? 0,
    freeShippingThreshold: query.data?.freeShippingThreshold ?? 5000,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
