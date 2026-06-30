import { Sparkles, ChevronRight } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface BreadcrumbsProps {
  items: string[];
  onItemClick: (index: number) => void;
}

export const Breadcrumbs = ({ items, onItemClick }: BreadcrumbsProps) => {
  const isMobile = isMobileUserAgent();

  if (isMobile || items.length === 0) return null;

  return (
    <nav className="flex items-center space-x-3 text-xs tracking-wider uppercase mb-8 bg-neutral-50/80 backdrop-blur-md p-4 rounded-none shadow-sm border-b border-neutral-200 dark:bg-neutral-900/80 dark:border-neutral-800">
      <button
        onClick={() => onItemClick(0)}
        className="hover:text-amber-600 dark:hover:text-rose-400 transition-colors duration-300 flex items-center"
        aria-label="Home"
      >
        <Sparkles className="h-4 w-4" />
      </button>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <ChevronRight className="h-3 w-3 text-neutral-400 font-light" />
          <button
            onClick={() => onItemClick(index + 1)}
            className={`transition-colors duration-300 hover:text-amber-600 dark:hover:text-rose-400 ${
              index === items.length - 1
                ? 'font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-900 dark:border-neutral-100 pb-0.5'
                : 'text-neutral-500 font-normal'
            }`}
          >
            {item}
          </button>
        </div>
      ))}
    </nav>
  );
};

// Alias for backward compatibility
export const GemFashionStyle = Breadcrumbs;