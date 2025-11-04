import { isMobileUserAgent } from '@/hooks/use-mobile';

const CheckoutSkeleton = () => {
    const isMobile = isMobileUserAgent();

  return (
      <div className="min-h-screen bg-gray-50">
        <div className={`container mx-auto py-6 ${!isMobile ? 'xl:px-24' : 'pb-32 px-2'}`}>
          {!isMobile && (
            <div className="mb-6">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {!isMobile && (
                  <div className="p-6 border-b">
                    <div className="h-2 w-full bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="flex justify-between">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
                          <div className="hidden sm:block space-y-2">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {/* Customer Details Card Skeleton */}
                  <div className="border rounded-lg">
                    <div className="p-6 border-b">
                      <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Card Skeleton */}
                  <div className="border rounded-lg">
                    <div className="p-6 border-b">
                      <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div>
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Skeleton */}
                <div className={`border-t bg-gray-50 ${isMobile ? 'fixed bottom-0 left-0 right-0 z-50 shadow-lg p-2' : 'p-6'}`}>
                  <div className="flex justify-between max-w-md mx-auto gap-2">
                    <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm sticky top-6">
                <div className="p-6 border-b">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="p-6 space-y-4">
                  {/* Items skeleton */}
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                          <div className="flex justify-between">
                            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-gray-200" />

                  {/* Price breakdown skeleton */}
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-gray-200" />

                  {/* Total skeleton */}
                  <div className="flex justify-between">
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CheckoutSkeleton;
