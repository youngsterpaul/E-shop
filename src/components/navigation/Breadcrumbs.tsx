
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
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6 bg-white p-4 rounded-lg shadow-sm">
      <button
        onClick={() => onItemClick(0)}
        className="hover:text-orange-600 transition-colors flex items-center"
      >
        <Home className="h-4 w-4" />
      </button>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <button
            onClick={() => onItemClick(index + 1)}
            className={`hover:text-orange-600 transition-colors ${
              index === items.length - 1
                ? 'font-semibold text-gray-900'
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