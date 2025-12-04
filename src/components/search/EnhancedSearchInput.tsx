import React, { useState, useRef, useEffect } from 'react';
import { Search, SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SearchSuggestions from './SearchSuggestions';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
interface EnhancedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}
const EnhancedSearchInput: React.FC<EnhancedSearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search for products...",
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation(); // 👈 add this

  const {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory
  } = useSearchHistory();
  const {
    suggestions,
    isLoading
  } = useSearchSuggestions(value, searchHistory);
  const isMobile = isMobileUserAgent();

  // Hide input when navigating to another route
  useEffect(() => {
    onChange('');
    setIsFocused(false);
    setSelectedIndex(-1);
  }, [location.pathname]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleSubmit = (query: string = value) => {
    if (!query.trim()) return;
    const trimmedQuery = query.trim();
    addToHistory(trimmedQuery);
    onSearch(trimmedQuery);
    setIsFocused(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : -1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : suggestions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const truncatedSuggestion = suggestions[selectedIndex].text.split(' ').slice(0, 3).join(' ');
          handleSubmit(truncatedSuggestion);
        } else {
          handleSubmit();
        }
        break;
      case 'Escape':
        setIsFocused(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };
  const handleSuggestionClick = (suggestion: string) => {
    const truncatedSuggestion = suggestion.split(' ').slice(0, 3).join(' ');
    onChange(truncatedSuggestion);
    handleSubmit(truncatedSuggestion);
  };
  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };
  return <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        {!isMobile && <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none z-10" />}
        <Input 
          ref={inputRef} 
          type="search" 
          placeholder={placeholder} 
          className={`h-12 text-base bg-muted/40 border-border/50 rounded-full transition-all duration-200 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 ${isMobile ? 'pl-4 pr-4' : 'pl-12 pr-28'}`} 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          onFocus={() => {
            setIsFocused(true);
            setSelectedIndex(-1);
          }} 
          onKeyDown={handleKeyDown} 
        />
        
        {!isMobile && (
          <div className="absolute right-1.5 flex items-center gap-1">
            {value && (
              <Button 
                type="button" 
                variant="ghost"
                size="sm"
                onClick={handleClear} 
                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground" 
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button 
              type="button" 
              onClick={() => handleSubmit()} 
              className="h-9 px-5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium" 
              aria-label="Search"
            >
              Search
            </Button>
          </div>
        )}
      </div>

      {isFocused && <SearchSuggestions suggestions={suggestions} query={value} isLoading={isLoading} selectedIndex={selectedIndex} onSuggestionClick={handleSuggestionClick} onRemoveFromHistory={removeFromHistory} onClearHistory={clearHistory} hasHistory={searchHistory.length > 0} />}
    </div>;
};
export default EnhancedSearchInput;