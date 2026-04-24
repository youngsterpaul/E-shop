import { Product } from "@/queries/productQueries";
import { UserIntent } from "./userIntent";

/**
 * Client-side fallback for smart product sorting
 * Used when the edge function is unavailable
 */
export const smartSortFallback = (
  products: Product[],
  intent: UserIntent,
  options?: { purchasedProductIds?: string[]; purchasedCategories?: string[] }
): Product[] => {
  const purchasedIds = new Set(options?.purchasedProductIds || []);
  const purchasedCats = (options?.purchasedCategories || intent.purchasedCategories || []).map(c =>
    c.toLowerCase()
  );

  // Build over-viewed set: products viewed >5 times without action (cart/wishlist)
  const viewCounts = new Map<string, number>();
  (intent.viewedProducts || []).forEach(id => {
    viewCounts.set(id, (viewCounts.get(id) || 0) + 1);
  });

  return [...products]
    .map((p) => {
      let score = 0;

      // ---- Penalties (logged-in personalization) ----
      if (purchasedIds.has(p.product_id)) {
        score -= 100; // already owned
      }
      const vc = viewCounts.get(p.product_id) || 0;
      const engaged =
        intent.cartProductIds?.includes(p.product_id) ||
        intent.wishlistProductIds?.includes(p.product_id) ||
        intent.clickedProducts?.includes(p.product_id);
      if (vc > 5 && !engaged) {
        score -= 30; // over-viewed but not converted
      }

      // Wishlist items - highest priority
      if (intent.wishlistProductIds?.includes(p.product_id)) {
        score += 80;
      }

      // Cart items - high intent
      if (intent.cartProductIds?.includes(p.product_id)) {
        score += 70;
      }

      // Category affinity (weighted by recency)
      const categoryIndex = intent.viewedCategories?.findIndex(
        (c) => p.categories?.toLowerCase().includes(c.toLowerCase())
      );
      if (categoryIndex !== undefined && categoryIndex !== -1) {
        score += Math.max(40 - categoryIndex * 5, 10);
      }

      // Purchased categories (repeat behavior)
      if (intent.purchasedCategories?.some(
        (c) => p.categories?.toLowerCase().includes(c.toLowerCase())
      )) {
        score += 35;
      }

      // Collaborative-filtering proxy: products in user's purchased categories
      // with strong social proof (reviews_count) -> "what similar users bought"
      if (
        purchasedCats.length > 0 &&
        !purchasedIds.has(p.product_id) &&
        purchasedCats.some(c => p.categories?.toLowerCase().includes(c))
      ) {
        const reviews = p.reviews_count || 0;
        if (reviews >= 20) score += 25;
        else if (reviews >= 5) score += 15;
      }

      // Recently viewed products
      const viewIndex = intent.viewedProducts?.indexOf(p.product_id);
      if (viewIndex !== undefined && viewIndex !== -1) {
        score += Math.max(25 - viewIndex * 3, 5);
      }

      // Clicked products (engaged but not added to cart)
      if (intent.clickedProducts?.includes(p.product_id)) {
        score += 15;
      }

      // Search term matches
      if (intent.searchedTerms?.some(
        (term) => p.name?.toLowerCase().includes(term.toLowerCase())
      )) {
        score += 30;
      }

      // Dwell time bonus (spent time looking at this product)
      const dwellTime = intent.dwellTime?.[p.product_id];
      if (dwellTime) {
        score += Math.min(dwellTime, 20); // Cap at 20 points
      }

      // Price range preference
      if (intent.preferredPriceRange && p.price) {
        const [minPrice, maxPrice] = intent.preferredPriceRange;
        if (p.price >= minPrice && p.price <= maxPrice) {
          score += 15;
        }
      }

      // Quality signals
      score += Math.min(p.reviews_count || 0, 20);
      score += Math.round((p.rating || 0) * 5);
      
      if (p.featured) {
        score += 10;
      }

      return { ...p, relevance_score: score };
    })
    .sort((a, b) => {
      if (b.relevance_score !== a.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      return new Date((b as any).created_at).getTime() -
             new Date((a as any).created_at).getTime();
    });
};
