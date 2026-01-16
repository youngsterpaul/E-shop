import { Product } from "@/queries/productQueries";
import { UserIntent } from "./userIntent";

export const smartSortFallback = (
  products: Product[],
  intent: UserIntent
): Product[] => {
  return [...products]
    .map((p) => {
      let score = 0;

      if (intent.viewedCategories.some(c => p.categories?.includes(c))) score += 30;
      if (intent.viewedProducts.includes(p.product_id)) score += 20;
      if (intent.cartProductIds.includes(p.product_id)) score += 50;
      if (intent.wishlistProductIds.includes(p.product_id)) score += 60;
      score += Math.min(p.reviews_count || 0, 20);
      if (p.featured) score += 10;

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
