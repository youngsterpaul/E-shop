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
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'history':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'product':
        return <Package className="w-4 h-4 text-blue-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="font-semibold text-orange-600">
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

  const isMobile = isMobileUserAgent();

  return (
    <div className={cn(
      "bg-white border border-gray-200 shadow-lg z-50 max-h-80 overflow-y-auto",
      isMobile ? [
        // Mobile: Kilimall-style full-screen overlay
        "fixed inset-0 top-16 bg-white z-50 max-h-none overflow-y-auto",
        "border-none shadow-none"
      ] : [
        // Desktop: Original dropdown style
        "absolute top-full left-0 right-0 rounded-b-lg"
      ]
    )}>
      {isLoading && (
        <div className={cn(
          "text-center text-gray-500",
          isMobile ? "p-8 pt-16" : "p-4"
        )}>
          <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          <span className="text-sm mt-2 block">Loading suggestions...</span>
        </div>
      )}

      {!isLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className={cn(
          "text-center text-gray-500",
          isMobile ? "p-8 pt-16" : "p-4"
        )}>
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No suggestions found</p>
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <>
          {!query.trim() && hasHistory && (
            <div className={cn(
              "border-b border-gray-100 flex items-center justify-between",
              isMobile ? "p-4 bg-gray-50" : "p-3"
            )}>
              <span className={cn(
                "font-medium text-gray-600",
                isMobile ? "text-base" : "text-sm"
              )}>
                Recent Searches
              </span>
              <button
                onClick={onClearHistory}
                className={cn(
                  "text-gray-400 hover:text-gray-600 transition-colors",
                  isMobile ? "text-sm px-2 py-1" : "text-xs"
                )}
              >
                Clear All
              </button>
            </div>
          )}

          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.category}-${suggestion.text}`}
              className={cn(
                "flex items-center justify-between cursor-pointer transition-colors group",
                isMobile ? [
                  // Mobile: Kilimall-style larger touch targets
                  "p-4 hover:bg-gray-50 border-b border-gray-100 min-h-[60px]",
                  selectedIndex === index && "bg-orange-50 border-l-4 border-orange-500"
                ] : [
                  // Desktop: Original compact style
                  "p-3 hover:bg-gray-50",
                  selectedIndex === index && "bg-orange-50 border-l-2 border-orange-500"
                ]
              )}
              onClick={() => onSuggestionClick(suggestion.text)}
            >
              <div className={cn(
                "flex items-center flex-1 min-w-0",
                isMobile ? "space-x-4" : "space-x-3"
              )}>
                <div className={cn(
                  isMobile ? "w-5 h-5" : "w-4 h-4"
                )}>
                  {getCategoryIcon(suggestion.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-gray-800 truncate block",
                    isMobile ? "text-base leading-relaxed" : "text-sm"
                  )}>
                    {highlightMatch(suggestion.text.split(' ').slice(0, 3).join(' '), query)}
                  </span>
                  {isMobile && suggestion.category === 'popular' && (
                    <span className="text-xs text-gray-400 mt-1 block">
                      Popular search
                    </span>
                  )}
                </div>
                {!isMobile && suggestion.category === 'popular' && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
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
                    "hover:bg-gray-200 rounded-full transition-colors opacity-0 group-hover:opacity-100",
                    isMobile ? "p-2 ml-2" : "p-1"
                  )}
                >
                  <X className={cn(
                    "text-gray-400",
                    isMobile ? "w-4 h-4" : "w-3 h-3"
                  )} />
                </button>
              )}
            </div>
          ))}
        </>
      )}

      {!query.trim() && suggestions.length > 0 && (
        <div className={cn(
          "border-t border-gray-100 text-center",
          isMobile ? "p-4 bg-gray-50" : "p-3"
        )}>
          <p className={cn(
            "text-gray-400",
            isMobile ? "text-sm" : "text-xs"
          )}>
            Start typing to see more suggestions
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;