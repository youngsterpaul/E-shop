
import React, { useState, useRef, useEffect } from 'react';
import { Search, SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SearchSuggestions from './SearchSuggestions';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { isMobileUserAgent } from '@/hooks/use-mobile';

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

  const { searchHistory, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
  const { suggestions, isLoading } = useSearchSuggestions(value, searchHistory);
  const isMobile = isMobileUserAgent();

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
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : -1
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > -1 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSubmit(suggestions[selectedIndex].text);
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
    onChange(suggestion);
    handleSubmit(suggestion);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        {!isMobile && (
          <Search className="absolute left-3 top-4 h-4 w-4 text-muted-foreground pointer-events-none item-center" />
        )}
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          className={`/pr-16 h-12 text-base border-2 border-gray-200 rounded-lg transition-all duration-200 ${isMobile ? 'pl-3' : 'pl-9'}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />
        
        <div className="absolute right-2 top-2 flex items-center space-x-1">
          {!isMobile && (
            <Button
              type="button"
              onClick={() => handleSubmit()}
              className="h-8 bg-gray-50 hover:bg-gray-100 px-3"
              aria-label="Search"
            >
              <SearchIcon className="text-gray-800 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isFocused && (
        <SearchSuggestions
          suggestions={suggestions}
          query={value}
          isLoading={isLoading}
          selectedIndex={selectedIndex}
          onSuggestionClick={handleSuggestionClick}
          onRemoveFromHistory={removeFromHistory}
          onClearHistory={clearHistory}
          hasHistory={searchHistory.length > 0}
        />
      )}
    </div>
  );
};

export default EnhancedSearchInput;
