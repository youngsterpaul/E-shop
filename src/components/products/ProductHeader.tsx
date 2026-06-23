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
  placeholder = 'Search for products...',
  autoFocusSearch = false,
}: PageHeaderProps) => {
  const isMobile = isMobileUserAgent();

  if (!isMobile) return null;

  return (
    <div 
      className="fixed top-0 z-40 bg-background border-b border-gray-200 px-2 pt-2 pb-2 w-full"
    >
      <div className="flex w-full items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-8 w-8"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <EnhancedSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          onSearch={onSearch}
          placeholder={placeholder}
          className="w-full"
          autoFocus={autoFocusSearch}
        />
        <Button
          type="button"
          variant="ghost"
          onClick={() => onSearch(searchQuery)}
          className="h-8 px-2"
        >
          <Search className="text-gray-800 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
