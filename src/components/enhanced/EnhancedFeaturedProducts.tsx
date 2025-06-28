
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const featuredProducts = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    price: 185000,
    originalPrice: 210000,
    image: "/placeholder.svg",
    rating: 4.8,
    reviews: 234,
    badge: "Best Seller",
    category: "Smartphones"
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    price: 165000,
    originalPrice: 190000,
    image: "/placeholder.svg",
    rating: 4.7,
    reviews: 189,
    badge: "New",
    category: "Smartphones"
  },
  {
    id: 3,
    name: "MacBook Pro M3",
    price: 320000,
    originalPrice: 350000,
    image: "/placeholder.svg",
    rating: 4.9,
    reviews: 156,
    badge: "Premium",
    category: "Laptops"
  },
  {
    id: 4,
    name: "AirPods Pro 2",
    price: 28000,
    originalPrice: 32000,
    image: "/placeholder.svg",
    rating: 4.6,
    reviews: 312,
    badge: "Popular",
    category: "Audio"
  },
  {
    id: 5,
    name: "Dell XPS 13",
    price: 145000,
    originalPrice: 165000,
    image: "/placeholder.svg",
    rating: 4.5,
    reviews: 98,
    badge: "Deal",
    category: "Laptops"
  },
  {
    id: 6,
    name: "iPad Air M2",
    price: 95000,
    originalPrice: 110000,
    image: "/placeholder.svg",
    rating: 4.7,
    reviews: 203,
    badge: "Hot",
    category: "Tablets"
  }
];

const categories = [
  { name: "Smartphones", count: 245 },
  { name: "Laptops", count: 156 },
  { name: "Audio", count: 189 },
  { name: "Tablets", count: 98 },
  { name: "Accessories", count: 312 },
  { name: "Gaming", count: 87 }
];

const EnhancedFeaturedProducts = () => {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right', ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const scrollAmount = isMobile ? 280 : 320;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Categories Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Shop by Category</h2>
            {!isMobile && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scroll('left', categoryScrollRef)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scroll('right', categoryScrollRef)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div
            ref={categoryScrollRef}
            className={`flex gap-4 ${isMobile ? 'overflow-x-auto scrollbar-hide pb-2' : 'overflow-hidden'}`}
          >
            {categories.map((category) => (
              <Card
                key={category.name}
                className={`${isMobile ? 'min-w-[140px]' : 'min-w-[160px]'} cursor-pointer hover:shadow-md transition-shadow bg-white`}
              >
                <CardContent className="p-4 text-center">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-semibold text-lg">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.count} items</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            {!isMobile && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scroll('left', scrollRef)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scroll('right', scrollRef)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div
            ref={scrollRef}
            className={`flex gap-4 ${isMobile ? 'overflow-x-auto scrollbar-hide pb-4' : 'overflow-hidden'}`}
          >
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className={`${isMobile ? 'min-w-[260px]' : 'min-w-[300px]'} hover:shadow-lg transition-all duration-300 cursor-pointer bg-white`}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <Badge className="absolute top-2 left-2 bg-primary">
                      {product.badge}
                    </Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 p-2"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      {product.category}
                    </p>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 text-sm font-medium">
                          {product.rating}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({product.reviews} reviews)
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {formatPrice(product.originalPrice)}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-green-600">
                        Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </Badge>
                    </div>

                    <Button className="w-full" size={isMobile ? "sm" : "default"}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Flash Sale Section */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-6 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">⚡ Flash Sale</h3>
            <p className="text-lg mb-4">Limited time offers - Up to 70% off</p>
            <div className="flex justify-center space-x-4 text-center mb-4">
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm">Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold">34</div>
                <div className="text-sm">Minutes</div>
              </div>
              <div>
                <div className="text-2xl font-bold">56</div>
                <div className="text-sm">Seconds</div>
              </div>
            </div>
            <Button variant="secondary" size="lg">
              Shop Flash Sale
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFeaturedProducts;
