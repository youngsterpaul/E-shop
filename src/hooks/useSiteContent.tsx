import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface SiteContent {
  id: string;
  page_key: string;
  title: string;
  content: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AboutPageContent {
  story: {
    title: string;
    paragraphs: string[];
  };
  mission: {
    title: string;
    paragraphs: string[];
  };
  values: Array<{
    name: string;
    description: string;
  }>;
  cta: {
    title: string;
    description: string;
  };
}

export const useSiteContent = (pageKey?: string) => {
  const queryClient = useQueryClient();

  const { data: content, isLoading } = useQuery({
    queryKey: ['site-content', pageKey],
    queryFn: async () => {
      if (pageKey) {
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .eq('page_key', pageKey)
          .single();
        if (error) throw error;
        return data as SiteContent;
      } else {
        const { data, error } = await supabase
          .from('site_content')
          .select('*');
        if (error) throw error;
        return data as SiteContent[];
      }
    },
  });

  const updateContent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SiteContent> & { id: string }) => {
      const { data, error } = await supabase
        .from('site_content')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast.success('Content updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update content: ' + error.message);
    },
  });

  return {
    content,
    isLoading,
    updateContent,
  };
};

export const useAboutContent = () => {
  const { content, isLoading, updateContent } = useSiteContent('about');
  
  const aboutContent = content as SiteContent | undefined;
  const parsedContent = aboutContent?.content as unknown as AboutPageContent | undefined;

  return {
    aboutContent: parsedContent,
    rawContent: aboutContent,
    isLoading,
    updateContent,
  };
};
