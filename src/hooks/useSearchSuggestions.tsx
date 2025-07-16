
import { useState, useEffect, useCallback } from 'react';
import { useProductSearch } from '@/hooks/useProducts';

interface SearchSuggestion {
  text: string;
  category: 'product' | 'popular' | 'history';
  count?: number;
}

const POPULAR_SEARCHES = [
  'smartphones',
  'laptops',
  'headphones',
  'cameras',
  'tablets',
  'smartwatches',
  'speakers',
  'accessories'
];

export const useSearchSuggestions = (query: string, searchHistory: string[]) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: products } = useProductSearch(debouncedQuery);

  const generateSuggestions = useCallback(() => {
    if (!query.trim()) {
      // Show history and popular searches when no query
      const historySuggestions: SearchSuggestion[] = searchHistory
        .slice(0, 5)
        .map(item => ({ text: item, category: 'history' }));
      
      const popularSuggestions: SearchSuggestion[] = POPULAR_SEARCHES
        .slice(0, 5)
        .map(item => ({ text: item, category: 'popular' }));

      setSuggestions([...historySuggestions, ...popularSuggestions]);
      return;
    }

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    const allSuggestions: SearchSuggestion[] = [];

    // Add matching history items
    const matchingHistory = searchHistory
      .filter(item => item.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(item => ({ text: item, category: 'history' as const }));

    // Add matching popular searches
    const matchingPopular = POPULAR_SEARCHES
      .filter(item => item.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(item => ({ text: item, category: 'popular' as const }));

    // Add product-based suggestions
    const productSuggestions: SearchSuggestion[] = products
      ? products.slice(0, 4).map(product => ({
          text: product.name,
          category: 'product' as const
        }))
      : [];

    allSuggestions.push(...matchingHistory, ...matchingPopular, ...productSuggestions);

    // Remove duplicates and limit to 8 suggestions
    const uniqueSuggestions = allSuggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
      )
      .slice(0, 8);

    setSuggestions(uniqueSuggestions);
    setIsLoading(false);
  }, [query, debouncedQuery, products, searchHistory]);

  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  return { suggestions, isLoading };
};
