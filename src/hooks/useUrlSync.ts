
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface UrlSyncState {
  searchQuery: string;
  sortOption: string;
  currentPage: number;
  itemsPerPage: number;
}

interface UrlSyncSetters {
  setSearchQuery: (query: string) => void;
  setSortOption: (option: string) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (size: number) => void;
}

interface UrlSyncOptions {
  preserveParams?: string[]; // Additional params to preserve in URL
}

/**
 * Hook to sync component state with URL parameters
 */
export const useUrlSync = (
  state: UrlSyncState,
  setters: UrlSyncSetters,
  options: UrlSyncOptions = {}
) => {
  const location = useLocation();
  const isMobile = isMobileUserAgent();
  const { preserveParams = [] } = options;

  // Read from URL on mount and when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || params.get('search');
    const s = params.get('sort');
    const p = params.get('page');
    const size = params.get('size');

    if (q) setters.setSearchQuery(q);
    if (s) setters.setSortOption(s);
    if (p && !isMobile) setters.setCurrentPage(parseInt(p));
    if (size && !isMobile) setters.setItemsPerPage(parseInt(size));
  }, [location.search, isMobile]);

  // Write to URL when state changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // Preserve specified params
    const preserved = new URLSearchParams();
    preserveParams.forEach(param => {
      const value = params.get(param);
      if (value) preserved.set(param, value);
    });

    // Set search query
    if (state.searchQuery) {
      preserved.set('q', state.searchQuery);
    }

    // Set sort option
    if (state.sortOption !== 'featured') {
      preserved.set('sort', state.sortOption);
    }

    // Set pagination (desktop only)
    if (!isMobile) {
      if (state.currentPage > 1) {
        preserved.set('page', state.currentPage.toString());
      }
      if (state.itemsPerPage !== 24) {
        preserved.set('size', state.itemsPerPage.toString());
      }
    }

    window.history.replaceState({}, '', `${location.pathname}?${preserved}`);
  }, [
    state.searchQuery,
    state.sortOption,
    state.currentPage,
    state.itemsPerPage,
    isMobile,
    location.pathname,
    preserveParams,
  ]);
};