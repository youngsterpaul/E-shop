
import { useState, useEffect, useCallback } from 'react';
import { useProductSearch } from '@/hooks/useProducts';
import { usePopularSearches } from '@/hooks/usePopularSearches';

export interface SearchSuggestion {
  text: string;
  category: 'product' | 'popular' | 'history';
  count?: number;
  image?: string;
  price?: number;
  productId?: string;
}

export const useSearchSuggestions = (query: string, searchHistory: string[]) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Fetch admin-managed popular searches
  const { data: popularSearches = [] } = usePopularSearches();

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
      
      const popularSuggestions: SearchSuggestion[] = popularSearches
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
    const matchingPopular = popularSearches
      .filter(item => item.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(item => ({ text: item, category: 'popular' as const }));

    // Add product-based suggestions with images and prices
    const productSuggestions: SearchSuggestion[] = products
      ? (
          // Flatten products from paginated response
          Array.isArray(products.pages)
            ? products.pages.flatMap(page => page.products).slice(0, 5).map(product => ({
                text: product.name,
                category: 'product' as const,
                image: product.image_urls?.[0] || undefined,
                price: product.price || undefined,
                productId: product.product_id
              }))
            : []
        )
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
  }, [query, debouncedQuery, products, searchHistory, popularSearches]);

  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  return { suggestions, isLoading };
};
