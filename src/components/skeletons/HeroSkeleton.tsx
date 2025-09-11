
import { Skeleton } from '@/components/ui/skeleton';

const HeroSkeleton = () => {
  return (
    <div className="relative overflow-hidden h-[300px] sm:h-[400px] md:h-[500px]">
      <Skeleton className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-black/40" />
      <div className="container h-full flex items-center justify-center relative z-10">
        <div className="text-center max-w-xl px-4 space-y-4">
          <Skeleton className="h-12 w-80 mx-auto bg-white/20" />
          <Skeleton className="h-6 w-96 mx-auto bg-white/20" />
          <Skeleton className="h-12 w-32 mx-auto bg-white/20" />
        </div>
      </div>
    </div>
  );
};

export default HeroSkeleton;
