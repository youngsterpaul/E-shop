
import { Skeleton } from '@/components/ui/skeleton';
import Header from '../Header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { MobileHeader } from '../ui/mobile-header';
import { ShoppingBag } from 'lucide-react';
import MobileNav from '../MobileNav';

const CartSkeleton = () => {
  const isMobile = isMobileUserAgent();

  return (
    <div className="min-h-screen bg-gray-50">
        {!isMobile && <Header />}
        {isMobile && <MobileHeader 
          title="Shopping Cart"
          rightAction={
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <ShoppingBag className="h-4 w-4" />
              <span>0</span>
            </div>
          }
        />
      } 
      <div className="container mx-auto px-4 py-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Cart Header Skeleton */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              
              {/* Cart Items Skeleton */}
              <div className="divide-y divide-gray-200">
                {Array(3).fill(null).map((_, index) => (
                  <div key={index} className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-4 mt-1" />
                      <Skeleton className="w-20 h-20 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              
              {/* Shipping Options Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                {Array(2).fill(null).map((_, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="text-right space-y-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-16" />
                </div>
              </div>

              {/* Price Breakdown Skeleton */}
              <div className="space-y-2">
                {Array(4).fill(null).map((_, index) => (
                  <div key={index} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>

              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
};

export default CartSkeleton;
