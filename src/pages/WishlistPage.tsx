<<<<<<< HEAD
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, ArrowLeft, Settings } from 'lucide-react';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { MobileHeader } from '@/components/ui/mobile-header';
import Footer from '@/components/Footer';

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

  // Grid layout configuration similar to EnhancedFeaturedProducts
  const gridConfig = useMemo(() => {
    if (isMobile) {
      return {
        cols: "grid-cols-2",
        gap: "gap-2",
        padding: "p-2"
      };
    }
    return {
      cols: "grid-cols-7",
      gap: "gap-1",
      padding: "px-0 lg:px-1"
    };
  }, [isMobile]);

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
        .eq('user_id', user?.id || '');

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
        .eq('user_id', user?.id || '')
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
          <div className={`container mx-auto px-4 py-8 ${!isMobile ? 'container px-4 xl:px-24':''}`}>
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
      <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
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
        
        <main className={`${isMobile ? 'pb-20' : 'container pb-8 px-4 xl:px-24'}`}>
          <div className={`container mx-auto ${gridConfig.padding} py-8`}>
           {/* Header section */}
            <div className={`flex items-center justify-between mb-4 ${isMobile ? 'px-2' : ''}`}>
              <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
            </div>

            {loading ? (
              <div className={`${!isMobile ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                <div className={`grid ${gridConfig.cols} ${gridConfig.gap}`}>
                  {[...Array(isMobile ? 6 : 14)].map((_, index) => (
                    <Card key={index} className={`${isMobile ? 'rounded-lg' : 'rounded-none border-r border-b border-gray-200'}`}>
                      <CardContent className={`${isMobile ? 'p-3' : 'p-2'}`}>
                        {/* Image skeleton */}
                        <div className={`w-full bg-gray-200 rounded-md mb-2 animate-pulse ${isMobile ? 'h-32' : 'h-24'}`} />
                        
                        {/* Title skeleton */}
                        <div className={`bg-gray-200 rounded mb-1 animate-pulse ${isMobile ? 'h-4' : 'h-3'}`} />
                        <div className={`bg-gray-200 rounded mb-2 animate-pulse ${isMobile ? 'h-4 w-3/4' : 'h-3 w-3/4'}`} />
                        
                        {/* Price skeleton */}
                        <div className={`bg-gray-200 rounded mb-2 animate-pulse ${isMobile ? 'h-4 w-1/3' : 'h-3 w-1/3'}`} />
                        
                        {/* Buttons skeleton */}
                        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-col gap-1'}`}>
                          <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-8' : 'h-7'}`} />
                          <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-8' : 'h-7'}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-600 mb-6">Save your favorite items for later</p>
                <Link to="/">
                  <Button className="bg-primary hover:bg-primary/90">
                    Explore Products
                  </Button>
                </Link>
              </div>
            ) : (
              <div className={`${!isMobile ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                {/* Products Grid with responsive layout */}
                <div className={`grid ${gridConfig.cols} ${gridConfig.gap}`}>
                  {wishlistItems.map((item) => (
                    <Card key={item.product_id} className={`${isMobile ? 'rounded-lg' : 'rounded-none border-r border-b border-gray-200'}`}>
                      <CardContent className={`${isMobile ? 'p-3' : 'p-2'} relative`}>
                        <div className="relative">
                          <img
                            src={item.products.image_urls?.[0] || '/placeholder.svg'}
                            alt={item.products.name}
                            className={`w-full object-cover rounded-md mb-2 ${isMobile ? 'h-32' : 'h-24'}`}
                          />
                          <Button 
                            variant="destructive"
                            size="icon"
                            className={`absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white shadow-md ${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`}
                            onClick={() => removeFromWishlist(item.product_id)}
                          >
                            <Trash2 className={`${isMobile ? 'h-3 w-3' : 'h-2.5 w-2.5'}`} />
                          </Button>
                        </div>
                        
                        <h3 className={`font-semibold text-gray-900 line-clamp-2 mb-1 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                          {item.products.name}
                        </h3>
                        
                        <p className={`text-primary font-semibold mb-2 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                          {formatPrice(item.products.price)}
                        </p>
                        
                        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-col gap-1'}`}>
                          <Button 
                            onClick={() => moveToCart(item)} 
                            className={`bg-green-600 hover:bg-green-700 text-white ${isMobile ? 'text-xs py-1.5' : 'text-xs py-1 px-2'}`}
                            size={isMobile ? "sm" : "sm"}
                          >
                            <ShoppingCart className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-2.5 w-2.5'}`} />
                            {isMobile ? 'Move to Cart' : 'Add'}
                          </Button>
                          
                          <Link
                            to={`/product/${item.products.name
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, '')}/${item.product_id}`}
                          >
                            <Button 
                              variant="outline" 
                              className={`w-full ${isMobile ? 'text-xs py-1.5' : 'text-xs py-1 px-2'}`}
                              size={isMobile ? "sm" : "sm"}
                            >
                              {isMobile ? 'View Product' : 'View'}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <MobileNav />
      </div>
    </>
  );
};

export default WishlistPage;
=======
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, ArrowLeft, Settings } from 'lucide-react';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { MobileHeader } from '@/components/ui/mobile-header';
import Footer from '@/components/Footer';

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

  // Grid layout configuration similar to EnhancedFeaturedProducts
  const gridConfig = useMemo(() => {
    if (isMobile) {
      return {
        cols: "grid-cols-2",
        gap: "gap-2",
        padding: "p-2"
      };
    }
    return {
      cols: "grid-cols-7",
      gap: "gap-1",
      padding: "px-0 lg:px-1"
    };
  }, [isMobile]);

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
        .eq('user_id', user?.id || '');

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
        .eq('user_id', user?.id || '')
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
          <div className={`container mx-auto px-4 py-8 ${!isMobile ? 'container px-4 xl:px-24':''}`}>
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
      <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
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
        
        <main className={`${isMobile ? 'pb-20' : 'container pb-8 px-4 xl:px-24'}`}>
          <div className={`container mx-auto ${gridConfig.padding} py-8`}>
           {/* Header section */}
            <div className={`flex items-center justify-between mb-4 ${isMobile ? 'px-2' : ''}`}>
              <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
            </div>

            {loading ? (
              <div className={`${!isMobile ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                <div className={`grid ${gridConfig.cols} ${gridConfig.gap}`}>
                  {[...Array(isMobile ? 6 : 14)].map((_, index) => (
                    <Card key={index} className={`${isMobile ? 'rounded-lg' : 'rounded-none border-r border-b border-gray-200'}`}>
                      <CardContent className={`${isMobile ? 'p-3' : 'p-2'}`}>
                        {/* Image skeleton */}
                        <div className={`w-full bg-gray-200 rounded-md mb-2 animate-pulse ${isMobile ? 'h-32' : 'h-24'}`} />
                        
                        {/* Title skeleton */}
                        <div className={`bg-gray-200 rounded mb-1 animate-pulse ${isMobile ? 'h-4' : 'h-3'}`} />
                        <div className={`bg-gray-200 rounded mb-2 animate-pulse ${isMobile ? 'h-4 w-3/4' : 'h-3 w-3/4'}`} />
                        
                        {/* Price skeleton */}
                        <div className={`bg-gray-200 rounded mb-2 animate-pulse ${isMobile ? 'h-4 w-1/3' : 'h-3 w-1/3'}`} />
                        
                        {/* Buttons skeleton */}
                        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-col gap-1'}`}>
                          <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-8' : 'h-7'}`} />
                          <div className={`bg-gray-200 rounded animate-pulse ${isMobile ? 'h-8' : 'h-7'}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-600 mb-6">Save your favorite items for later</p>
                <Link to="/">
                  <Button className="bg-primary hover:bg-primary/90">
                    Explore Products
                  </Button>
                </Link>
              </div>
            ) : (
              <div className={`${!isMobile ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                {/* Products Grid with responsive layout */}
                <div className={`grid ${gridConfig.cols} ${gridConfig.gap}`}>
                  {wishlistItems.map((item) => (
                    <Card key={item.product_id} className={`${isMobile ? 'rounded-lg' : 'rounded-none border-r border-b border-gray-200'}`}>
                      <CardContent className={`${isMobile ? 'p-3' : 'p-2'} relative`}>
                        <div className="relative">
                          <img
                            src={item.products.image_urls?.[0] || '/placeholder.svg'}
                            alt={item.products.name}
                            className={`w-full object-cover rounded-md mb-2 ${isMobile ? 'h-32' : 'h-24'}`}
                          />
                          <Button 
                            variant="destructive"
                            size="icon"
                            className={`absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white shadow-md ${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`}
                            onClick={() => removeFromWishlist(item.product_id)}
                          >
                            <Trash2 className={`${isMobile ? 'h-3 w-3' : 'h-2.5 w-2.5'}`} />
                          </Button>
                        </div>
                        
                        <h3 className={`font-semibold text-gray-900 line-clamp-2 mb-1 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                          {item.products.name}
                        </h3>
                        
                        <p className={`text-primary font-semibold mb-2 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                          {formatPrice(item.products.price)}
                        </p>
                        
                        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-col gap-1'}`}>
                          <Button 
                            onClick={() => moveToCart(item)} 
                            className={`bg-green-600 hover:bg-green-700 text-white ${isMobile ? 'text-xs py-1.5' : 'text-xs py-1 px-2'}`}
                            size={isMobile ? "sm" : "sm"}
                          >
                            <ShoppingCart className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-2.5 w-2.5'}`} />
                            {isMobile ? 'Move to Cart' : 'Add'}
                          </Button>
                          
                          <Link
                            to={`/product/${item.products.name
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, '')}/${item.product_id}`}
                          >
                            <Button 
                              variant="outline" 
                              className={`w-full ${isMobile ? 'text-xs py-1.5' : 'text-xs py-1 px-2'}`}
                              size={isMobile ? "sm" : "sm"}
                            >
                              {isMobile ? 'View Product' : 'View'}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        {!isMobile && <Footer />}
        <MobileNav />
      </div>
    </>
  );
};

export default WishlistPage;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
