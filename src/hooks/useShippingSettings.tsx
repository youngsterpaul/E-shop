import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ShippingSettings {
  shippingFee: number;
  freeShippingThreshold: number;
}

export const useShippingSettings = () => {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['shippingSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['shipping_fee', 'free_shipping_threshold']);
      
      if (error) throw error;
      
      const settingsMap = data.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {} as Record<string, any>);
      
      return {
        shippingFee: Number(settingsMap.shipping_fee) || 0,
        freeShippingThreshold: Number(settingsMap.free_shipping_threshold) || 10000
      } as ShippingSettings;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });

  return {
    shippingFee: settings?.shippingFee ?? 0,
    freeShippingThreshold: settings?.freeShippingThreshold ?? 10000,
    isLoading,
    error
  };
};
