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

export const GemFashionStyleHeader = ({
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
      className="fixed top-0 z-40 bg-[#FAF9F6] border-b border-[#E5E4E2] px-3 pt-3 pb-3 w-full shadow-sm"
    >
      <div className="flex w-full items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-9 w-9 text-[#111111] hover:bg-[#104E3A]/5 hover:text-[#104E3A] transition-colors rounded-full"
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <EnhancedSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          onSearch={onSearch}
          placeholder={placeholder}
          className="w-full bg-white border-[#D4D1CA] focus-visible:ring-[#104E3A] text-[#111111] rounded-md"
          autoFocus={autoFocusSearch}
        />
        <Button
          type="button"
          variant="ghost"
          onClick={() => onSearch(searchQuery)}
          className="h-9 px-3 text-[#111111] hover:bg-[#104E3A]/5 hover:text-[#104E3A] transition-colors rounded-full"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};