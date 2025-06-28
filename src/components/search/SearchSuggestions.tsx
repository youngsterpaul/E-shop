
import React from 'react';
import { Search, Clock, TrendingUp, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 max-h-80 overflow-y-auto">
      {isLoading && (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          <span className="text-sm mt-2 block">Loading suggestions...</span>
        </div>
      )}

      {!isLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className="p-4 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No suggestions found</p>
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <>
          {!query.trim() && hasHistory && (
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Recent Searches</span>
              <button
                onClick={onClearHistory}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.category}-${suggestion.text}`}
              className={cn(
                "flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors",
                selectedIndex === index && "bg-orange-50 border-l-2 border-orange-500"
              )}
              onClick={() => onSuggestionClick(suggestion.text)}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getCategoryIcon(suggestion.category)}
                <span className="text-gray-800 truncate">
                  {highlightMatch(suggestion.text, query)}
                </span>
                {suggestion.category === 'popular' && (
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
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </>
      )}

      {!query.trim() && suggestions.length > 0 && (
        <div className="p-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Start typing to see more suggestions
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
