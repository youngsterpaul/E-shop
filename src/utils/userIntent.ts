export type UserIntent = {
  viewedCategories: string[];
  viewedProducts: string[];
  searchedTerms: string[];
  cartProductIds: string[];
  wishlistProductIds: string[];
  purchasedCategories: string[];
  lastVisit: string;
  sessionCount: number;
  preferredPriceRange: [number, number] | null;
  preferredBrands: string[];
  clickedProducts: string[]; // Products user clicked but didn't add to cart
  dwellTime: Record<string, number>; // Product ID -> seconds spent viewing
};

const KEY = "user_intent_v2";
const MAX_ITEMS = 50; // Limit array sizes to prevent localStorage bloat

export const getUserIntent = (): UserIntent => {
  if (typeof window === "undefined") {
    return emptyIntent();
  }

  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return emptyIntent();
    
    const parsed = JSON.parse(stored);
    // Migrate from v1 if needed
    return {
      ...emptyIntent(),
      ...parsed,
    };
  } catch {
    return emptyIntent();
  }
};

export const updateUserIntent = (
  patch: Partial<UserIntent>
) => {
  if (typeof window === "undefined") return;
  
  const current = getUserIntent();
  const updated = { ...current };

  // Handle array fields - prepend new items and dedupe
  const arrayFields: (keyof UserIntent)[] = [
    'viewedCategories',
    'viewedProducts', 
    'searchedTerms',
    'cartProductIds',
    'wishlistProductIds',
    'purchasedCategories',
    'clickedProducts',
    'preferredBrands',
  ];

  for (const field of arrayFields) {
    if (patch[field] && Array.isArray(patch[field])) {
      const currentArray = (current[field] as string[]) || [];
      const newItems = patch[field] as string[];
      // Prepend new items (most recent first), dedupe, limit size
      const merged = [...new Set([...newItems, ...currentArray])].slice(0, MAX_ITEMS);
      (updated as any)[field] = merged;
    }
  }

  // Handle scalar fields
  if (patch.lastVisit) updated.lastVisit = patch.lastVisit;
  if (patch.sessionCount !== undefined) updated.sessionCount = patch.sessionCount;
  if (patch.preferredPriceRange) updated.preferredPriceRange = patch.preferredPriceRange;

  // Handle dwell time (merge objects)
  if (patch.dwellTime) {
    updated.dwellTime = { ...current.dwellTime, ...patch.dwellTime };
    // Keep only top 100 products by dwell time
    const entries = Object.entries(updated.dwellTime);
    if (entries.length > 100) {
      const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, 100);
      updated.dwellTime = Object.fromEntries(sorted);
    }
  }

  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save user intent:', err);
  }
};

// Track a product view with category extraction
export const trackProductView = (
  productId: string,
  category?: string,
  price?: number
) => {
  const updates: Partial<UserIntent> = {
    viewedProducts: [productId],
  };

  if (category) {
    // Extract main category from "Category > Subcategory" format
    const mainCategory = category.split('>')[0]?.trim();
    if (mainCategory) {
      updates.viewedCategories = [mainCategory, category];
    } else {
      updates.viewedCategories = [category];
    }
  }

  // Track price preference
  if (price) {
    const current = getUserIntent();
    const currentRange = current.preferredPriceRange || [price, price];
    updates.preferredPriceRange = [
      Math.min(currentRange[0], price * 0.5),
      Math.max(currentRange[1], price * 1.5),
    ];
  }

  updateUserIntent(updates);
};

// Track search queries
export const trackSearch = (query: string) => {
  if (!query?.trim()) return;
  updateUserIntent({
    searchedTerms: [query.trim().toLowerCase()],
  });
};

// Track cart additions
export const trackCartAdd = (productId: string, category?: string) => {
  const updates: Partial<UserIntent> = {
    cartProductIds: [productId],
    clickedProducts: [productId], // Also counts as engagement
  };
  
  if (category) {
    const mainCategory = category.split('>')[0]?.trim();
    updates.viewedCategories = mainCategory ? [mainCategory] : [category];
  }
  
  updateUserIntent(updates);
};

// Track wishlist additions
export const trackWishlistAdd = (productId: string, category?: string) => {
  const updates: Partial<UserIntent> = {
    wishlistProductIds: [productId],
  };
  
  if (category) {
    const mainCategory = category.split('>')[0]?.trim();
    updates.viewedCategories = mainCategory ? [mainCategory] : [category];
  }
  
  updateUserIntent(updates);
};

// Track completed purchases
export const trackPurchase = (categories: string[]) => {
  updateUserIntent({
    purchasedCategories: categories,
  });
};

// Track product click (didn't add to cart yet)
export const trackProductClick = (productId: string) => {
  updateUserIntent({
    clickedProducts: [productId],
  });
};

// Track time spent on a product page
export const trackDwellTime = (productId: string, seconds: number) => {
  const current = getUserIntent();
  const currentTime = current.dwellTime[productId] || 0;
  updateUserIntent({
    dwellTime: { [productId]: currentTime + seconds },
  });
};

// Track session start
export const trackSessionStart = () => {
  const current = getUserIntent();
  updateUserIntent({
    lastVisit: new Date().toISOString(),
    sessionCount: (current.sessionCount || 0) + 1,
  });
};

// Clear old data (call periodically)
export const cleanupOldIntent = () => {
  const current = getUserIntent();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  if (current.lastVisit && new Date(current.lastVisit).getTime() < thirtyDaysAgo) {
    // Reset if user hasn't visited in 30 days
    localStorage.setItem(KEY, JSON.stringify(emptyIntent()));
  }
};

const emptyIntent = (): UserIntent => ({
  viewedCategories: [],
  viewedProducts: [],
  searchedTerms: [],
  cartProductIds: [],
  wishlistProductIds: [],
  purchasedCategories: [],
  lastVisit: new Date().toISOString(),
  sessionCount: 1,
  preferredPriceRange: null,
  preferredBrands: [],
  clickedProducts: [],
  dwellTime: {},
});
