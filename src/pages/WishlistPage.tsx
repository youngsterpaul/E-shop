import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, ArrowLeft, Settings } from 'lucide-react';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

// Using WishlistItem shape from useWishlist hook; no local interface needed


const WishlistPage = () => {
  const isMobile = isMobileUserAgent();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems, loading, removeFromWishlist: removeFromWishlistHook } = useWishlist();
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

  // Transform wishlist items to match the old interface
  const transformedWishlistItems = useMemo(() => 
    wishlistItems.map(item => ({
      id: item.id,
      product_id: item.product_id,
      products: {
        product_id: item.product.id,
        name: item.product.name,
        image_urls: [item.product.image],
        price: item.product.price
      }
    })), [wishlistItems]
  );

  const moveToCart = async (item: { id: string; product_id: string; products: any }) => {
    await addToCart(item.product_id, {}, 1);
    removeFromWishlistHook(item.product_id);
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
       
        <main className={`${isMobile ? 'pb-20' : 'container px-4 xl:px-24 pb-8'}`}>
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
                  {transformedWishlistItems.map((item) => (
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
                            onClick={() => removeFromWishlistHook(item.product_id)}
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
