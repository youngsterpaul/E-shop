
import { Skeleton } from '@/components/ui/skeleton';

const HeroSkeleton = () => {
  return (
    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] mb-8 md:mb-12">
      <Skeleton className="w-full h-full rounded-lg" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 md:h-12 w-80 mx-auto" />
          <Skeleton className="h-6 w-60 mx-auto" />
          <Skeleton className="h-12 w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default HeroSkeleton;
