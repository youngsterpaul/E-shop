import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface SharedWishlist {
  id: string;
  user_id: string;
  share_code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  view_count: number;
  created_at: string;
  expires_at: string | null;
}

export const useWishlistSharing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's shared wishlists
  const { data: sharedWishlists, isLoading } = useQuery({
    queryKey: ['shared-wishlists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('shared_wishlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SharedWishlist[];
    },
    enabled: !!user
  });

  // Create shareable wishlist link
  const createShareLink = useMutation({
    mutationFn: async ({ title, description }: { title?: string; description?: string }) => {
      if (!user) throw new Error('Must be logged in');

      // Generate unique share code
      const shareCode = `WL${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

      const { data, error } = await supabase
        .from('shared_wishlists')
        .insert({
          user_id: user.id,
          share_code: shareCode,
          title: title || 'My Wishlist',
          description,
          is_public: true
        })
        .select()
        .single();

      if (error) throw error;
      return data as SharedWishlist;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shared-wishlists'] });
      
      const shareUrl = `${window.location.origin}/wishlist/shared/${data.share_code}`;
      navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Wishlist shared!",
        description: "Link copied to clipboard"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to share wishlist",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Fetch shared wishlist by code (for viewing)
  const fetchSharedWishlist = async (shareCode: string) => {
    const { data, error } = await supabase
      .from('shared_wishlists')
      .select('*')
      .eq('share_code', shareCode)
      .eq('is_public', true)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase
      .from('shared_wishlists')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);

    return data as SharedWishlist;
  };

  // Delete shared wishlist
  const deleteShareLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shared_wishlists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-wishlists'] });
      toast({
        title: "Share link deleted",
        description: "The wishlist is no longer accessible"
      });
    }
  });

  // Toggle public/private
  const toggleVisibility = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const { error } = await supabase
        .from('shared_wishlists')
        .update({ is_public: isPublic })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-wishlists'] });
    }
  });

  return {
    sharedWishlists,
    isLoading,
    createShareLink: createShareLink.mutate,
    isCreating: createShareLink.isPending,
    deleteShareLink: deleteShareLink.mutate,
    toggleVisibility: toggleVisibility.mutate,
    fetchSharedWishlist
  };
};
