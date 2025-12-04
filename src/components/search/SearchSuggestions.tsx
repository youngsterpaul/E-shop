import React from 'react';
import { Search, Clock, TrendingUp, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface SearchSuggestion {
  text: string;
  category: 'product' | 'popular' | 'history';
  count?: number;
}

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  query: string;
  isLoading: boolean;
  selectedIndex: number;
  onSuggestionClick: (suggestion: string) => void;
  onRemoveFromHistory: (suggestion: string) => void;
  onClearHistory: () => void;
  hasHistory: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  query,
  isLoading,
  selectedIndex,
  onSuggestionClick,
  onRemoveFromHistory,
  onClearHistory,
  hasHistory
}) => {
  const isMobile = isMobileUserAgent();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'history':
        return <Clock className={cn("text-muted-foreground", isMobile ? "w-4 h-4" : "w-3.5 h-3.5")} />;
      case 'popular':
        return <TrendingUp className={cn("text-primary", isMobile ? "w-4 h-4" : "w-3.5 h-3.5")} />;
      case 'product':
        return <Package className={cn("text-blue-500", isMobile ? "w-4 h-4" : "w-3.5 h-3.5")} />;
      default:
        return <Search className={cn("text-muted-foreground", isMobile ? "w-4 h-4" : "w-3.5 h-3.5")} />;
    }
  };

  const truncateToThreeWords = (text: string) => {
    const words = text.split(' ');
    if (words.length <= 3) return text;
    return words.slice(0, 3).join(' ') + '...';
  };

  const highlightMatch = (text: string, query: string) => {
    const truncatedText = truncateToThreeWords(text);
    if (!query.trim()) return truncatedText;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = truncatedText.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="font-semibold text-primary">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (!suggestions.length && !isLoading && !hasHistory) {
    return null;
  }

  return (
    <div
      className={cn(
        "z-50 overscroll-contain",
        isMobile
          ? "fixed inset-x-0 top-[56px] bottom-0 bg-background overflow-y-auto"
          : [
              "absolute top-full left-0 right-0 mt-2",
              "max-h-[400px] overflow-y-auto overflow-x-hidden",
              "bg-popover rounded-lg border border-border",
              "shadow-lg shadow-black/5",
              "animate-in fade-in-0 slide-in-from-top-2 duration-200"
            ]
      )}
    >
      {isLoading && (
        <div className={cn(
          "text-center text-muted-foreground",
          isMobile ? "p-6" : "p-4"
        )}>
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <span className="text-xs mt-2 block">Loading...</span>
        </div>
      )}

      {!isLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className={cn(
          "text-center text-muted-foreground",
          isMobile ? "p-6" : "p-4"
        )}>
          <Search className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-xs">No suggestions found</p>
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <>
          {!query.trim() && hasHistory && (
            <div className={cn(
              "flex items-center justify-between border-b border-border",
              isMobile ? "px-4 py-2.5 bg-muted/50" : "px-3 py-2"
            )}>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recent
              </span>
              <button
                onClick={onClearHistory}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          <div className="py-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.category}-${suggestion.text}`}
                className={cn(
                  "flex items-center justify-between cursor-pointer transition-colors group",
                  isMobile ? [
                    "px-4 py-3 active:bg-accent",
                    selectedIndex === index && "bg-accent"
                  ] : [
                    "px-3 py-2 mx-1 rounded-md hover:bg-accent",
                    selectedIndex === index && "bg-accent"
                  ]
                )}
                onClick={() => onSuggestionClick(suggestion.text)}
              >
                <div className="flex items-center flex-1 min-w-0 gap-2.5">
                  <div className="flex-shrink-0 opacity-60">
                    {getCategoryIcon(suggestion.category)}
                  </div>
                  <span className={cn(
                    "text-foreground truncate",
                    isMobile ? "text-sm" : "text-sm"
                  )}>
                    {highlightMatch(suggestion.text, query)}
                  </span>
                  {suggestion.category === 'popular' && (
                    <span className="text-[10px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                      Popular
                    </span>
                  )}
                </div>
                
                {suggestion.category === 'history' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromHistory(suggestion.text);
                    }}
                    className={cn(
                      "hover:bg-muted rounded-full transition-colors",
                      isMobile 
                        ? "p-1.5 ml-2" 
                        : "p-1 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!query.trim() && suggestions.length > 0 && !isMobile && (
        <div className="border-t border-border px-3 py-2">
          <p className="text-[10px] text-muted-foreground text-center">
            Type to search products
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
