
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedProductsSkeleton = () => {
  return (
    <div className="mb-8 md:mb-12">
      <Skeleton className="h-8 w-48 mx-auto mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        {Array(6)
          .fill(null)
          .map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
      </div>
    </div>
  );
};

export default FeaturedProductsSkeleton;
