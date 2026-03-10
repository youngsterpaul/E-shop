import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { WishlistShareButton } from '@/components/wishlist/WishlistShareButton';

const WishlistPage = () => {
  const isMobile = isMobileUserAgent();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems, loading, removeFromWishlist: removeFromWishlistHook } = useWishlist();
  const { toast } = useToast();

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
    toast({
      title: "Added to cart",
      description: "Item moved to your cart"
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <main className={`${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6 py-8' : 'px-4 pb-24 pt-8'}`}>
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view your wishlist</h2>
            <p className="text-muted-foreground mb-6">Save your favorite items for later</p>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className={`${!isMobile ? 'max-w-[1400px] mx-auto px-4 lg:px-6 py-8' : 'px-4 pb-24 pt-4'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
            <p className="text-sm text-muted-foreground">{wishlistItems.length} items saved</p>
          </div>
          {wishlistItems.length > 0 && <WishlistShareButton />}
        </div>

        {loading ? (
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 lg:grid-cols-5 gap-4'}`}>
            {[...Array(isMobile ? 6 : 10)].map((_, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className={`w-full bg-muted rounded-lg mb-3 animate-pulse ${isMobile ? 'h-36' : 'h-44'}`} />
                  <div className="h-4 bg-muted rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-2/3 mb-3 animate-pulse" />
                  <div className="h-9 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Save your favorite items for later</p>
            <Link to="/">
              <Button>Explore Products</Button>
            </Link>
          </div>
        ) : (
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 lg:grid-cols-5 gap-4'}`}>
            {transformedWishlistItems.map((item) => (
              <Card key={item.product_id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden group min-w-0">
                <CardContent className="p-0">
                  <div className="relative">
                    <Link
                      to={`/product/${item.products.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')}/${item.product_id}`}
                    >
                      <img
                        src={item.products.image_urls?.[0] || '/placeholder.svg'}
                        alt={item.products.name}
                        className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${isMobile ? 'h-36' : 'h-44'}`}
                      />
                    </Link>
                    <Button 
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      onClick={() => removeFromWishlistHook(item.product_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="p-3">
                    <Link
                      to={`/product/${item.products.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')}/${item.product_id}`}
                    >
                      <h3 className="font-medium text-foreground line-clamp-2 text-sm mb-2 hover:text-primary transition-colors">
                        {item.products.name}
                      </h3>
                    </Link>
                    
                    <p className="text-primary font-semibold mb-3">
                      {formatPrice(item.products.price)}
                    </p>
                    
                    <Button 
                      onClick={() => moveToCart(item)} 
                      className="w-full h-9"
                      size="sm"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
};

export default WishlistPage;
