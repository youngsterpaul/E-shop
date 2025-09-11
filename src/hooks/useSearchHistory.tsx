
import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'smartkenya_search_history';
const MAX_HISTORY_ITEMS = 10;

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error parsing search history:', error);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
      }
    }
  }, []);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    
    const trimmedQuery = query.trim();
    setSearchHistory(prevHistory => {
      // Remove if already exists to avoid duplicates
      const filteredHistory = prevHistory.filter(item => item !== trimmedQuery);
      // Add to beginning and limit to MAX_HISTORY_ITEMS
      const newHistory = [trimmedQuery, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
      
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const removeFromHistory = (query: string) => {
    setSearchHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item !== query);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
};
