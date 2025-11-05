import { isMobileUserAgent } from '@/hooks/use-mobile';

interface CategorySkeletonProps {
  showAll?: boolean;
}

const CategorySkeleton: React.FC<CategorySkeletonProps> = ({ showAll = false }) => {
  const isMobile = isMobileUserAgent();
  
  const itemCount = isMobile && !showAll ? 8 : 10;
  const gridCols = isMobile ? "grid-cols-4" : "grid-cols-10";

  if (isMobile) {
    return (
      <div className="grid grid-cols-4 gap-y-2 px-2 my-2 rounded-lg">
        {Array.from({ length: itemCount }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center p-1 bg-white"
          >
            <div className="relative mb-4 rounded-sm overflow-hidden bg-gray-200 shadow-lg w-full aspect-square animate-pulse">
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
            </div>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="container shadow-sm mx-auto px-8 block bottom-0 left-0 right-0 bg-white border-t border-gray-200/50">
      <div className="border-b my-4 items-center mx-auto py-2 bg-white">
        <div className="w-48 h-7 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className={`grid ${gridCols} gap-3 bg-white p-4 shadow-sm`}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative w-24 h-24 mb-4 overflow-hidden bg-gray-200 shadow-lg animate-pulse">
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
            </div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategorySkeleton;