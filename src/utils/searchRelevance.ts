import { Product } from "@/queries/productQueries";

/**
 * Search Relevance Scorer
 * 
 * Prioritizes products by how closely they match the search term,
 * using category/subcategory as the strongest signal since product
 * names often don't contain the generic search term.
 * 
 * Example: searching "laptops" → products in "Brand New Laptops" category
 * rank above "Laptop Charger" even if named "HP Pavilion 15".
 * 
 * Scoring tiers:
 * 1. Category/subcategory contains the search term (100pts)
 * 2. Exact name match (90pts)
 * 3. Name is core search term with extras (70pts)
 * 4. Name starts with search term (55pts)
 * 5. Search term is a standalone word in name (35pts / 20pts for accessories)
 * 6. Name contains search term as substring (15pts)
 * 7. Description match only (3pts)
 */
export const scoreSearchRelevance = (
  product: Product,
  searchTerm: string
): number => {
  if (!searchTerm?.trim()) return 0;

  const term = searchTerm.trim().toLowerCase();
  const name = (product.name || "").toLowerCase();
  const categories = (product.categories || "").toLowerCase();
  const description = (product.description || "").toLowerCase();

  // Normalize plurals: "laptops" → "laptop"
  const singularTerm = term.endsWith("s") ? term.slice(0, -1) : term;
  const pluralTerm = term.endsWith("s") ? term : term + "s";

  let score = 0;

  // --- CATEGORY/SUBCATEGORY MATCHING (highest priority) ---
  // Products whose category matches the search term are the most relevant.
  // e.g., searching "laptops" → products in "Brand New Laptops" category = 100pts
  const categoryMatch = matchesCategory(categories, term, singularTerm, pluralTerm);
  if (categoryMatch) {
    score += 100;
  }

  // --- NAME MATCHING ---

  // Tier 2: Exact name match (name IS the search term)
  if (name === term || name === singularTerm || name === pluralTerm) {
    score += 90;
  }
  // Tier 3: Name is essentially the search term with minor additions
  else if (isCoreName(name, term) || isCoreName(name, singularTerm)) {
    score += 70;
  }
  // Tier 4: Name starts with the search term
  else if (
    name.startsWith(term) ||
    name.startsWith(singularTerm) ||
    name.startsWith(pluralTerm)
  ) {
    score += 55;
  }
  // Tier 5: Search term appears as a complete word in the name
  else if (
    hasWholeWord(name, term) ||
    hasWholeWord(name, singularTerm)
  ) {
    // Distinguish "Laptop" (standalone product) from "Laptop Charger" (accessory)
    if (isAccessoryOrPart(name, term, singularTerm)) {
      score += 20; // It's an accessory/part — lower priority
    } else {
      score += 35;
    }
  }
  // Tier 6: Search term is a substring in the name
  else if (
    name.includes(term) ||
    name.includes(singularTerm)
  ) {
    score += 15;
  }

  // --- DESCRIPTION MATCHING ---
  if (
    description.includes(term) ||
    description.includes(singularTerm)
  ) {
    score += 3;
  }

  // --- QUALITY SIGNALS (tiebreakers) ---
  score += Math.min((product.rating || 0) * 1.5, 7);
  score += Math.min((product.reviews_count || 0) * 0.05, 5);

  if (product.featured) {
    score += 3;
  }

  return Math.round(score * 100) / 100;
};

/**
 * Check if the product's category string contains the search term.
 * Categories are stored as "Parent > Child" (e.g., "Computers & Accessories > Brand New Laptops").
 * We check each segment independently for a whole-word match.
 */
function matchesCategory(
  categories: string,
  term: string,
  singularTerm: string,
  pluralTerm: string
): boolean {
  if (!categories) return false;

  // Split by " > " to get individual category segments
  const segments = categories.split(/\s*>\s*/);

  for (const segment of segments) {
    const seg = segment.trim().toLowerCase();
    // Check if the segment contains the search term as a whole word
    if (
      hasWholeWord(seg, term) ||
      hasWholeWord(seg, singularTerm) ||
      hasWholeWord(seg, pluralTerm)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Check if the product name's "core" is the search term.
 * e.g., "HP Laptop 15-inch" → core concept is "Laptop"
 * vs "Laptop Charger USB-C" → core concept is "Charger"
 */
function isCoreName(name: string, term: string): boolean {
  if (!term) return false;
  const words = name.split(/\s+/);

  // If the term is one of the first 2 significant words and the name
  // doesn't have an accessory word right after it
  for (let i = 0; i < Math.min(words.length, 3); i++) {
    const word = words[i];
    if (
      word === term ||
      word === term + "s" ||
      word + "s" === term
    ) {
      // Check if next word is an accessory indicator
      const nextWord = words[i + 1] || "";
      if (!ACCESSORY_KEYWORDS.has(nextWord)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if a word appears as a whole word in text
 */
function hasWholeWord(text: string, word: string): boolean {
  if (!word) return false;
  const regex = new RegExp(`\\b${escapeRegex(word)}s?\\b`, "i");
  return regex.test(text);
}

/**
 * Detect if the product is an accessory/part for the searched item
 * e.g., "Laptop Charger", "Laptop Battery", "Laptop Stand"
 */
function isAccessoryOrPart(
  name: string,
  term: string,
  singularTerm: string
): boolean {
  const words = name.split(/\s+/);
  const termIndex = words.findIndex(
    (w) =>
      w === term ||
      w === singularTerm ||
      w === term + "s" ||
      w === singularTerm + "s"
  );

  if (termIndex === -1) return false;

  // Check words after the search term for accessory indicators
  for (let i = termIndex + 1; i < words.length; i++) {
    if (ACCESSORY_KEYWORDS.has(words[i])) {
      return true;
    }
  }

  // Check words before the search term for accessory indicators  
  for (let i = 0; i < termIndex; i++) {
    if (ACCESSORY_KEYWORDS.has(words[i])) {
      return true;
    }
  }

  return false;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Common words that indicate an accessory or component */
const ACCESSORY_KEYWORDS = new Set([
  "charger",
  "charging",
  "battery",
  "case",
  "cover",
  "screen",
  "protector",
  "stand",
  "holder",
  "cable",
  "cord",
  "adapter",
  "mount",
  "sleeve",
  "bag",
  "skin",
  "dock",
  "hub",
  "cooler",
  "cooling",
  "pad",
  "mat",
  "keyboard",
  "mouse",
  "headset",
  "earbuds",
  "speaker",
  "stylus",
  "pen",
  "strap",
  "band",
  "replacement",
  "spare",
  "part",
  "repair",
  "tool",
  "kit",
  "accessory",
  "accessories",
  "compatible",
  "for",
]);

/**
 * Sort products by search relevance
 * This is the main entry point - call after fetching search results
 */
export const sortBySearchRelevance = (
  products: Product[],
  searchTerm: string
): Product[] => {
  if (!searchTerm?.trim() || products.length === 0) return products;

  return [...products]
    .map((p) => ({
      ...p,
      _searchScore: scoreSearchRelevance(p, searchTerm),
    }))
    .sort((a, b) => {
      // Primary: search relevance
      if (b._searchScore !== a._searchScore) {
        return b._searchScore - a._searchScore;
      }
      // Secondary: featured products
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      // Tertiary: newer first
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    })
    .map(({ _searchScore, ...product }) => product);
};
