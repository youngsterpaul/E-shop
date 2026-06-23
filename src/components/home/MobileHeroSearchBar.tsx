import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';
import { cn } from '@/lib/utils';

const generateSlug = (name: string): string =>
  name.toLowerCase().replace(/&/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const GemFashionStyle = () => {
  const navigate = useNavigate();
  const { data: categories } = useCategoryHierarchy();
  const [activeId, setActiveId] = useState<number | 'all'>('all');
  const railRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Center the active pill
  useEffect(() => {
    const el = itemRefs.current[String(activeId)];
    if (el && railRef.current) {
      const rail = railRef.current;
      const left = el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2;
      rail.scrollTo({ left, behavior: 'smooth' });
    }
  }, [activeId]);

  const handleCategoryClick = (cat: { id: number; name: string; slug: string | null }) => {
    setActiveId(cat.id);
    const slug = cat.slug || generateSlug(cat.name);
    navigate(
      `/category/${slug}?id=${cat.id}&form=category&source=category|allCategory|${encodeURIComponent(cat.name)}`
    );
  };

  return (
    <>
      {/* Premium Fixed category pills rail */}
      <div className="fixed top-12 left-0 right-0 z-50 bg-background/95 backdrop-blur-md shadow-sm border-b border-zinc-100">
        <div className="relative max-w-md mx-auto">
          <div
            ref={railRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 py-3"
            style={{ scrollbarWidth: 'none' }}
          >
            {/* ALL pill */}
            <button
              ref={(el) => (itemRefs.current['all'] = el)}
              onClick={() => {
                setActiveId('all');
                navigate('/');
              }}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 border',
                activeId === 'all'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm scale-105'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              All Collection
            </button>

            {(categories || []).map((cat) => {
              const isActive = activeId === cat.id;
              return (
                <button
                  key={cat.id}
                  ref={(el) => (itemRefs.current[String(cat.id)] = el)}
                  onClick={() => handleCategoryClick(cat)}
                  className={cn(
                    'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 border whitespace-nowrap',
                    isActive
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm scale-105'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-900'
                  )}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from hiding behind the fixed bar */}
      <div className="h-14" />
    </>
  );
};

export default GemFashionStyle;