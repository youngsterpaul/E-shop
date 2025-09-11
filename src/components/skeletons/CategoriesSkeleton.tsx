
import { Skeleton } from '@/components/ui/skeleton';

const CategoriesSkeleton = () => {
  return (
    <div className="container mx-auto px-4">
      <Skeleton className="h-8 w-64 mx-auto mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="aspect-square">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesSkeleton;
