import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  business_hours: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  youtube_url: string;
  whatsapp_number: string;
  tiktok_url: string;
}

const defaultSettings: ContactSettings = {
  phone: '+254 758 475 467',
  email: 'support@smartkenya.co.ke',
  address: 'SmartKenya, Murang\'a, Kenya',
  business_hours: 'Mon-Fri from 8am to 5pm',
  facebook_url: 'https://facebook.com/smartkenya',
  twitter_url: 'https://twitter.com/smartkenya',
  instagram_url: 'https://instagram.com/smartkenya',
  youtube_url: 'https://youtube.com/smartkenya',
  whatsapp_number: '+254758475467',
  tiktok_url: '',
};

export const useContactSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery<ContactSettings>({
    queryKey: ['contactSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settings: ContactSettings = { ...defaultSettings };
      
      data?.forEach((item: { setting_key: string; setting_value: string | null }) => {
        if (item.setting_key in settings) {
          (settings as unknown as Record<string, string>)[item.setting_key] = item.setting_value || '';
        }
      });

      return settings;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<ContactSettings>) => {
      const promises = Object.entries(updates).map(async ([key, value]) => {
        const { error } = await supabase
          .from('contact_settings')
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq('setting_key', key);
        
        if (error) throw error;
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactSettings'] });
    },
  });

  return {
    settings: query.data || defaultSettings,
    isLoading: query.isLoading,
    error: query.error,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
