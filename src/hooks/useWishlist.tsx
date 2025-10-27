<<<<<<< HEAD
import { useState, useEffect } from 'react';
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
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      // First get wishlist items
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id, product_id, added_at')
        .eq('user_id', user.id);

      if (wishlistError) throw wishlistError;

      if (!wishlistData || wishlistData.length === 0) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

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
      }).filter(item => item.product.name); // Filter out items where product wasn't found

      setWishlistItems(formattedItems);
    } catch (error: any) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to wishlist",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          product_id: productId
        });

      if (error) throw error;

      await fetchWishlist();
      toast({
        title: "Added to wishlist",
        description: "Item has been added to your wishlist"
      });
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to add item to wishlist",
        variant: "destructive"
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      await fetchWishlist();
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist"
      });
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  return {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refetch: fetchWishlist
  };
};

=======
import { useState, useEffect } from 'react';
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
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      // First get wishlist items
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id, product_id, added_at')
        .eq('user_id', user.id);

      if (wishlistError) throw wishlistError;

      if (!wishlistData || wishlistData.length === 0) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

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
      }).filter(item => item.product.name); // Filter out items where product wasn't found

      setWishlistItems(formattedItems);
    } catch (error: any) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to wishlist",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          product_id: productId
        });

      if (error) throw error;

      await fetchWishlist();
      toast({
        title: "Added to wishlist",
        description: "Item has been added to your wishlist"
      });
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to add item to wishlist",
        variant: "destructive"
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      await fetchWishlist();
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist"
      });
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  return {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refetch: fetchWishlist
  };
};

>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
