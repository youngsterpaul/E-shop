
import { Home, ChevronRight } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface BreadcrumbsProps {
  items: string[];
  onItemClick: (index: number) => void;
}

export const Breadcrumbs = ({ items, onItemClick }: BreadcrumbsProps) => {
  const isMobile = isMobileUserAgent();

  if (isMobile || items.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 bg-card p-4 rounded-xl shadow-sm border border-border/50">
      <button
        onClick={() => onItemClick(0)}
        className="hover:text-primary transition-colors flex items-center"
      >
        <Home className="h-4 w-4" />
      </button>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <button
            onClick={() => onItemClick(index + 1)}
            className={`hover:text-primary transition-colors ${
              index === items.length - 1
                ? 'font-medium text-foreground'
                : ''
            }`}
          >
            {item}
          </button>
        </div>
      ))}
    </nav>
  );
};