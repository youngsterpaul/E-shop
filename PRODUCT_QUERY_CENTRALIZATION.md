# Product Query Centralization - Migration Complete

## Summary

All product-related data fetching has been centralized into a unified React Query system with shared query keys. This eliminates duplicate network requests when navigating between pages.

## Files Created

1. **`src/queries/productQueries.ts`** - Centralized query keys and fetchers
   - Single source of truth for all product queries
   - Consistent query key structure
   - Type-safe fetch functions

## Files Refactored

1. **`src/hooks/useProducts.tsx`**
   - Now delegates to centralized `productFetchers`
   - All React Query hooks use centralized keys
   - Maintains backward compatibility

2. **`src/hooks/useOptimizedProducts.tsx`**
   - Marked as deprecated with migration guidance
   - Now uses centralized query keys for cache sharing
   - Offline support maintained

3. **`src/hooks/useOptimizedProductsData.tsx`**
   - Updated to use centralized query keys
   - Filtering logic preserved

4. **`src/hooks/useOptimizedFeaturedProducts.tsx`**
   - Simplified to delegate to `useFeaturedProducts`
   - Marked as deprecated

5. **`src/hooks/useOptimizedRelatedProducts.tsx`**
   - Updated to use centralized fetchers and keys
   - Category decoding logic preserved

6. **`src/components/FeaturedProducts.tsx`**
   - Removed direct Supabase calls
   - Now uses `useFeaturedProducts` hook
   - Maintains same UI/UX

7. **`src/components/enhanced/EnhancedFeaturedProducts.tsx`**
   - Already using centralized hooks (no changes needed)

## Query Key Structure

All product queries now use consistent keys from `productKeys`:

```typescript
productKeys.all                                    // ['products']
productKeys.featured(pageSize)                     // ['products', 'featured', pageSize]
productKeys.detail(id)                             // ['products', 'detail', id]
productKeys.category(category, pageSize)           // ['products', 'category', category, pageSize]
productKeys.categoryById(id, pageSize)             // ['products', 'categoryById', id, pageSize]
productKeys.search(query, pageSize)                // ['products', 'search', query, pageSize]
productKeys.related(category, currentProductId)    // ['products', 'related', category, currentProductId]
```

## Benefits

✅ **No Duplicate Fetches** - Same data is never fetched twice; React Query shares cached data
✅ **Consistent Cache Times** - All queries use standardized `staleTime` and `gcTime`
✅ **Type Safety** - Centralized types prevent inconsistencies
✅ **Easy Invalidation** - Can invalidate all product queries with `queryClient.invalidateQueries(productKeys.all)`
✅ **Better Performance** - Reduced network requests = faster page transitions

## Backward Compatibility

All existing hooks and components continue to work without breaking changes:
- `useProducts()` - Still available, delegates to centralized fetchers
- `useFeaturedProducts()` - Enhanced with centralized caching
- `useProduct(id)` - Enhanced with centralized caching
- `useProductsByCategory()` - Enhanced with centralized caching
- `useProductSearch()` - Enhanced with centralized caching

## Cache Configuration

- **Featured Products**: 5 min stale, 10 min garbage collection
- **Product Details**: 5 min stale, 10 min garbage collection
- **Category Products**: 5 min stale, 10 min garbage collection
- **Search Results**: 2 min stale, 5 min garbage collection (shorter for freshness)
- **Related Products**: 10 min stale, 15 min garbage collection

## Testing Checklist

✅ Homepage featured products load without errors
✅ Category pages use cached data when possible
✅ Product detail pages load correctly
✅ Search functionality works with centralized queries
✅ Navigation between pages doesn't trigger duplicate fetches
✅ Network tab shows significantly fewer requests

## Future Improvements

1. **Prefetching**: Add prefetch on hover for product cards
2. **Optimistic Updates**: Add optimistic updates for cart/wishlist
3. **Persistence**: Add React Query persistence for offline support
4. **Background Refetch**: Configure background refetching for stale data

## Deprecated Hooks

The following hooks are marked as deprecated but still functional:
- `useOptimizedProducts()` - Use `useFeaturedProducts()` instead
- `useOptimizedFeaturedProducts()` - Use `useFeaturedProducts()` instead

These can be removed in a future cleanup pass once all consumers are updated.
