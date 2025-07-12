
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, ArrowLeft, Settings } from 'lucide-react';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import SiteBreadcrumb from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { MobileHeader } from '@/components/ui/mobile-header';

interface WishlistItem {
  id: string;
  product_id: string;
  products: {
    product_id: string;
    name: string;
    image_urls: string[];
    price: number;
  };
}

const WishlistPage = () => {
  const isMobile = isMobileUserAgent();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchWishlistItems();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWishlistItems = async () => {
    try {
      // First, get wishlist items
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id, product_id')
        .eq('user_id', user?.id);

      if (wishlistError) throw wishlistError;

      if (!wishlistData || wishlistData.length === 0) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      // Then, get product details for each wishlist item
      const productIds = wishlistData.map(item => item.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, image_urls, price')
        .in('product_id', productIds);

      if (productsError) throw productsError;

      // Combine the data
      const combinedData = wishlistData.map(wishlistItem => {
        const product = productsData?.find(p => p.product_id === wishlistItem.product_id);
        return {
          id: wishlistItem.id,
          product_id: wishlistItem.product_id,
          products: {
            product_id: product?.product_id || '',
            name: product?.name || '',
            image_urls: product?.image_urls || [],
            price: product?.price || 0
          }
        };
      }).filter(item => item.products.name); // Filter out items where product wasn't found

      setWishlistItems(combinedData);
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user?.id)
        .eq('product_id', productId);

      if (error) throw error;
      setWishlistItems(wishlistItems.filter(item => item.product_id !== productId));
      toast({
        title: "Success",
        description: "Item removed from wishlist.",
      })
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist.",
        variant: "destructive",
      })
    }
  };

  const moveToCart = async (item: WishlistItem) => {
    await addToCart(item.product_id, {}, 1);
    removeFromWishlist(item.product_id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className={`${isMobile ? 'pb-20' : 'pb-8'}`}>
          <div className="container mx-auto px-4 py-8">
            <SiteBreadcrumb 
              items={[
                { label: 'Home', href: '/' },
                { label: 'Wishlist' }
              ]}
              className="mb-6"
            />

            <div className="text-center py-12">
              <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your wishlist</h2>
              <p className="text-gray-600 mb-6">Save your favorite items for later</p>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <MobileNav />
      </div>
    );
  }

  return (
    <>
      {/* Wishlist Page Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "My Wishlist - SmartKenya",
          "description": "View and manage your wishlist at SmartKenya. Save your favorite items for later.",
          "url": "https://smartkenya.co.ke/wishlist",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://smartkenya.co.ke"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "My Wishlist",
                "item": "https://smartkenya.co.ke/wishlist"
              }
            ]
          }
        })}
      </script>

      <div className="min-h-screen bg-gray-50">
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader 
          title={'My Wishlist'}
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
        
        <main className={`${isMobile ? 'pb-20' : 'pb-8'}`}>
          <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <SiteBreadcrumb 
              items={[
                { label: 'Home', href: '/' },
                { label: 'Wishlist' }
              ]}
              className="mb-6"
            />

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
              <Link to="/products" className="text-primary hover:text-primary/80 flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading wishlist...</div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-600 mb-6">Save your favorite items for later</p>
                <Link to="/products">
                  <Button className="bg-primary hover:bg-primary/90">
                    Explore Products
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                  <Card key={item.product_id}>
                    <CardContent className="p-4">
                      <div className="relative">
                        <img
                          src={item.products.image_urls?.[0] || '/placeholder.svg'}
                          alt={item.products.name}
                          className="w-full h-48 object-cover rounded-md mb-4"
                        />
                        <Button 
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white shadow-md"
                          onClick={() => removeFromWishlist(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">{item.products.name}</h3>
                      <p className="text-primary font-semibold mb-3">{formatPrice(item.products.price)}</p>
                      <div className="flex justify-between">
                        <Button onClick={() => moveToCart(item)} className="bg-green-600 hover:bg-green-700 text-white">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Move to Cart
                        </Button>
                        <Link to={`/product/name/${item.product_id}`}>
                          <Button variant="outline">View Product</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

      </div>
    </>
  );
};

export default WishlistPage;
