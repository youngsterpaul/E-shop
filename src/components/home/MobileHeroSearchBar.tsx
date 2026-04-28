import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';
import { cn } from '@/lib/utils';

const generateSlug = (name: string): string =>
  name.toLowerCase().replace(/&/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const MobileHeroSearchBar = () => {
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
      {/* Fixed category pills rail */}
      <div className="fixed top-12 left-0 right-0 z-50 bg-background">
        <div className="relative">
          <div
            ref={railRef}
            className="flex items-end gap-1 overflow-x-auto scrollbar-hide px-3 pb-1.5 pt-2"
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
                'relative shrink-0 px-2 py-2 text-[14px] tracking-wide transition-colors',
                activeId === 'all'
                  ? 'text-foreground font-bold'
                  : 'text-muted-foreground font-medium'
              )}
            >
              ALL
              {activeId === 'all' && (
                <span className="absolute left-2 right-2 -bottom-0.5 h-[3px] rounded-full bg-primary" />
              )}
            </button>

            {(categories || []).map((cat) => {
              const isActive = activeId === cat.id;
              return (
                <button
                  key={cat.id}
                  ref={(el) => (itemRefs.current[String(cat.id)] = el)}
                  onClick={() => handleCategoryClick(cat)}
                  className={cn(
                    'relative shrink-0 px-3 py-2 text-[14px] whitespace-nowrap transition-colors',
                    isActive
                      ? 'text-foreground font-bold'
                      : 'text-muted-foreground font-medium hover:text-foreground'
                  )}
                >
                  {cat.name}
                  {isActive && (
                    <span className="absolute left-2 right-2 -bottom-0.5 h-[3px] rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
          {/* Subtle bottom divider line */}
          <div className="absolute left-0 right-0 bottom-0 h-px bg-border/60" />
        </div>
      </div>

      {/* Spacer to prevent content from hiding behind the fixed bar */}
      <div className="h-12" />
    </>
  );
};

export default MobileHeroSearchBar;
