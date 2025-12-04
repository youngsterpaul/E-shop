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
        return <Clock className={cn("text-muted-foreground", isMobile ? "w-5 h-5" : "w-4 h-4")} />;
      case 'popular':
        return <TrendingUp className={cn("text-primary", isMobile ? "w-5 h-5" : "w-4 h-4")} />;
      case 'product':
        return <Package className={cn("text-blue-500", isMobile ? "w-5 h-5" : "w-4 h-4")} />;
      default:
        return <Search className={cn("text-muted-foreground", isMobile ? "w-5 h-5" : "w-4 h-4")} />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
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
        "z-50 overflow-y-auto overscroll-contain",
        isMobile
          ? "fixed inset-x-0 top-[56px] bottom-0 bg-background"
          : [
            "absolute top-full left-0 right-0 mt-1",
            "max-h-[480px]",
            "bg-card rounded-xl border border-border/50",
            "shadow-lg",
            "animate-fade-in"
          ]
      )}
    >
      {isLoading && (
        <div className={cn(
          "text-center text-muted-foreground",
          isMobile ? "p-8" : "p-4"
        )}>
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <span className="text-sm mt-2 block">Loading suggestions...</span>
        </div>
      )}

      {!isLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className={cn(
          "text-center text-muted-foreground",
          isMobile ? "p-8" : "p-4"
        )}>
          <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">No suggestions found</p>
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <>
          {!query.trim() && hasHistory && (
            <div className={cn(
              "border-b border-border/50 flex items-center justify-between",
              isMobile ? "px-4 py-3 bg-muted/30" : "px-4 py-3"
            )}>
              <span className="text-sm font-medium text-foreground">
                Recent Searches
              </span>
              <button
                onClick={onClearHistory}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          <div className={cn(isMobile && "divide-y divide-border/30")}>
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.category}-${suggestion.text}`}
                className={cn(
                  "flex items-center justify-between cursor-pointer transition-colors group",
                  isMobile ? [
                    "px-4 py-3.5 active:bg-muted/50",
                    selectedIndex === index && "bg-primary/5 border-l-2 border-primary"
                  ] : [
                    "px-4 py-3 hover:bg-muted/50",
                    selectedIndex === index && "bg-primary/5 border-l-2 border-primary"
                  ]
                )}
                onClick={() => onSuggestionClick(suggestion.text)}
              >
                <div className="flex items-center flex-1 min-w-0 gap-3">
                  <div className="flex-shrink-0">
                    {getCategoryIcon(suggestion.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-foreground truncate block",
                      isMobile ? "text-base" : "text-sm"
                    )}>
                      {highlightMatch(suggestion.text, query)}
                    </span>
                    {isMobile && suggestion.category === 'popular' && (
                      <span className="text-xs text-muted-foreground">Trending</span>
                    )}
                  </div>
                  {!isMobile && suggestion.category === 'popular' && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
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
                        ? "p-2 ml-2" 
                        : "p-1.5 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <X className={cn(
                      "text-muted-foreground",
                      isMobile ? "w-4 h-4" : "w-3.5 h-3.5"
                    )} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!query.trim() && suggestions.length > 0 && (
        <div className={cn(
          "border-t border-border/50 text-center",
          isMobile ? "p-3 bg-muted/30" : "p-3"
        )}>
          <p className="text-xs text-muted-foreground">
            Start typing to see more suggestions
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;