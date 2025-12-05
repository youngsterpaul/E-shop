import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, TrendingUp, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import type { SearchSuggestion } from '@/hooks/useSearchSuggestions';

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
  const navigate = useNavigate();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'history':
        return <Clock className={cn("text-muted-foreground", isMobile ? "w-4 h-4" : "w-3.5 h-3.5")} />;
      case 'popular':
        return <TrendingUp className={cn("text-primary", isMobile ? "w-4 h-4" : "w-3.5 h-3.5")} />;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const generateSlug = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleProductClick = (suggestion: SearchSuggestion, e: React.MouseEvent) => {
    if (suggestion.productId) {
      e.stopPropagation();
      const slug = generateSlug(suggestion.text);
      navigate(`/product/${slug}/${suggestion.productId}`);
    } else {
      onSuggestionClick(suggestion.text);
    }
  };

  // Separate product suggestions from others
  const productSuggestions = suggestions.filter(s => s.category === 'product');
  const otherSuggestions = suggestions.filter(s => s.category !== 'product');

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
              "max-h-[500px] overflow-y-auto overflow-x-hidden",
              "bg-popover rounded-xl border border-border",
              "shadow-xl shadow-black/10",
              "animate-in fade-in-0 slide-in-from-top-2 duration-200"
            ]
      )}
    >
      {isLoading && (
        <div className={cn(
          "text-center text-muted-foreground",
          isMobile ? "p-6" : "p-4"
        )}>
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <span className="text-xs mt-2 block">Searching...</span>
        </div>
      )}

      {!isLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className={cn(
          "text-center text-muted-foreground",
          isMobile ? "p-6" : "p-6"
        )}>
          <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm font-medium">No results found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term</p>
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <>
          {/* History and Popular Suggestions */}
          {otherSuggestions.length > 0 && (
            <div className="py-1">
              {!query.trim() && hasHistory && (
                <div className={cn(
                  "flex items-center justify-between border-b border-border",
                  isMobile ? "px-4 py-2.5 bg-muted/30" : "px-3 py-2"
                )}>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Searches
                  </span>
                  <button
                    onClick={onClearHistory}
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {otherSuggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.category}-${suggestion.text}`}
                  className={cn(
                    "flex items-center justify-between cursor-pointer transition-all group",
                    isMobile ? [
                      "px-4 py-3 active:bg-accent",
                      selectedIndex === index && "bg-accent"
                    ] : [
                      "px-3 py-2.5 mx-1.5 my-0.5 rounded-lg hover:bg-accent",
                      selectedIndex === index && "bg-accent"
                    ]
                  )}
                  onClick={() => onSuggestionClick(suggestion.text)}
                >
                  <div className="flex items-center flex-1 min-w-0 gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      suggestion.category === 'history' ? "bg-muted" : "bg-primary/10"
                    )}>
                      {getCategoryIcon(suggestion.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-foreground block truncate",
                        isMobile ? "text-sm" : "text-sm"
                      )}>
                        {highlightMatch(suggestion.text, query)}
                      </span>
                      {suggestion.category === 'popular' && (
                        <span className="text-[10px] text-primary/70">Trending now</span>
                      )}
                    </div>
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
                          : "p-1.5 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}

                  {suggestion.category !== 'history' && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Product Suggestions with Thumbnails */}
          {productSuggestions.length > 0 && (
            <div className={cn(
              otherSuggestions.length > 0 && "border-t border-border"
            )}>
              <div className={cn(
                "flex items-center justify-between",
                isMobile ? "px-4 py-2.5 bg-muted/30" : "px-3 py-2"
              )}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Products
                </span>
                <span className="text-xs text-muted-foreground">
                  {productSuggestions.length} found
                </span>
              </div>

              <div className="py-1">
                {productSuggestions.map((suggestion, index) => {
                  const globalIndex = otherSuggestions.length + index;
                  return (
                    <div
                      key={`product-${suggestion.productId || suggestion.text}`}
                      className={cn(
                        "flex items-center gap-3 cursor-pointer transition-all group",
                        isMobile ? [
                          "px-4 py-3 active:bg-accent",
                          selectedIndex === globalIndex && "bg-accent"
                        ] : [
                          "px-3 py-2.5 mx-1.5 my-0.5 rounded-lg hover:bg-accent",
                          selectedIndex === globalIndex && "bg-accent"
                        ]
                      )}
                      onClick={(e) => handleProductClick(suggestion, e)}
                    >
                      {/* Product Thumbnail */}
                      <div className={cn(
                        "flex-shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50",
                        isMobile ? "w-14 h-14" : "w-12 h-12"
                      )}>
                        {suggestion.image ? (
                          <img
                            src={suggestion.image}
                            alt={suggestion.text}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Search className="w-4 h-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-foreground font-medium line-clamp-2 group-hover:text-primary transition-colors",
                          isMobile ? "text-sm" : "text-sm leading-tight"
                        )}>
                          {suggestion.text}
                        </p>
                        {suggestion.price && (
                          <p className="text-primary font-bold text-sm mt-0.5">
                            {formatPrice(suggestion.price)}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer hint */}
      {!query.trim() && suggestions.length > 0 && !isMobile && (
        <div className="border-t border-border px-3 py-2.5 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <Search className="w-3 h-3" />
            Start typing to search products
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;