import { Skeleton } from '@/components/ui/skeleton';

const GemFashionStyleSkeleton = () => {
  return (
    <div className="space-y-4 p-4 rounded-xl border border-stone-100 bg-stone-50/50 shadow-sm backdrop-blur-sm">
      {/* Product Image Placeholder with a soft editorial tint */}
      <div className="relative overflow-hidden rounded-lg bg-stone-100">
        <Skeleton className="aspect-[3/4] w-full bg-gradient-to-tr from-stone-200 via-stone-100 to-amber-50/40" />
      </div>

      {/* Product Brand / Category Placeholder */}
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3 w-1/4 bg-amber-900/10" />
        
        {/* Product Title Placeholder */}
        <Skeleton className="h-5 w-11/12 bg-stone-300" />
      </div>

      {/* Price and Color Swatch Placeholders */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <Skeleton className="h-4 w-1/5 bg-stone-300" />
        <div className="flex space-x-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full bg-stone-200" />
          <Skeleton className="h-3.5 w-3.5 rounded-full bg-amber-900/10" />
          <Skeleton className="h-3.5 w-3.5 rounded-full bg-stone-300" />
        </div>
      </div>
    </div>
  );
};

export default GemFashionStyleSkeleton;