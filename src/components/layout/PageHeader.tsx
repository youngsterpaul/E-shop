import { Button } from '@/components/ui/button';
import EnhancedSearchInput from '@/components/search/EnhancedSearchInput';
import { ChevronLeft, Search } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface PageHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (query: string) => void;
  onBack: () => void;
  placeholder?: string;
  autoFocusSearch?: boolean;
}

export const PageHeader = ({
  searchQuery,
  onSearchChange,
  onSearch,
  onBack,
  placeholder = 'Search Gem Fashion Style...',
  autoFocusSearch = false,
}: PageHeaderProps) => {
  const isMobile = isMobileUserAgent();

  if (!isMobile) return null;

  return (
    <div 
      className="fixed top-0 z-40 bg-zinc-50/95 backdrop-blur-md border-b border-zinc-200/80 px-3 pt-3 pb-3 w-full shadow-sm transition-all"
    >
      <div className="flex w-full items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-9 w-9 rounded-full hover:bg-zinc-200/60 text-zinc-700 transition-colors"
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 relative">
          <EnhancedSearchInput
            value={searchQuery}
            onChange={onSearchChange}
            onSearch={onSearch}
            placeholder={placeholder}
            className="w-full bg-white border-zinc-300 focus:border-amber-600 focus:ring-amber-600/20 rounded-md text-sm placeholder:text-zinc-400"
            autoFocus={autoFocusSearch}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => onSearch(searchQuery)}
          className="h-9 px-3 rounded-md text-zinc-800 hover:text-amber-700 hover:bg-amber-50 transition-colors"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};