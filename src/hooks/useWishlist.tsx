import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    inStock: boolean;
  };
  added_at: string;
}

export const useWishlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchWishlist = async (): Promise<WishlistItem[]> => {
    if (!user) return [];

    try {
      // First get wishlist items
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id, product_id, added_at')
        .eq('user_id', user.id);

      if (wishlistError) throw wishlistError;
      if (!wishlistData || wishlistData.length === 0) return [];

      // Get product details for wishlist items
      const productIds = wishlistData.map(item => item.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, price, image_urls, stock')
        .in('product_id', productIds);

      if (productsError) throw productsError;

      // Combine wishlist and product data
      const formattedItems = wishlistData.map(wishlistItem => {
        const product = productsData?.find(p => p.product_id === wishlistItem.product_id);
        return {
          id: wishlistItem.id,
          product_id: wishlistItem.product_id,
          product: {
            id: product?.product_id || '',
            name: product?.name || '',
            price: product?.price || 0,
            image: product?.image_urls?.[0] || '/placeholder.svg',
            inStock: (product?.stock || 0) > 0
          },
          added_at: wishlistItem.added_at || new Date().toISOString()
        };
      }).filter(item => item.product.name);

      return formattedItems;
    } catch (error: any) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  };

  // Use React Query for wishlist data
  const { data: wishlistItems = [], isLoading: loading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: fetchWishlist,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Add to wishlist mutation
  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user!.id,
          product_id: productId
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      toast({
        title: "Added to wishlist",
        description: "Item has been added to your wishlist"
      });
    },
    onError: (error: any) => {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to add item to wishlist",
        variant: "destructive"
      });
    }
  });

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to wishlist",
        variant: "destructive"
      });
      return;
    }
    await addMutation.mutateAsync(productId);
  };

  // Remove from wishlist mutation
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user!.id)
        .eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist"
      });
    },
    onError: (error: any) => {
      console.error('Error removing from wishlist:', error);
    }
  });

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    await removeMutation.mutateAsync(productId);
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  return {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] })
  };
};

