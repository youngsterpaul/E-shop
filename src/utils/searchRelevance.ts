import { Product } from "@/queries/productQueries";

/**
 * Search Relevance Scorer (Bucket-based)
 *
 * Strategy:
 *   1. Classify each product into a HARD TIER based on whether it's a primary
 *      product for the search term or an accessory/part for it.
 *   2. Sort buckets in fixed order — every primary product appears before
 *      every accessory, no matter the secondary score.
 *   3. Within each bucket, rank by a relevance score (name match strength +
 *      category match + quality signals).
 *
 * Example: searching "laptops"
 *   Bucket 0 (PRIMARY):    HP Pavilion 15, Lenovo ThinkPad, Dell XPS …
 *   Bucket 1 (ACCESSORY):  Laptop Battery, Laptop Charger, Laptop Stand …
 *   Bucket 2 (OTHER):      anything matched only by description
 */

// ─── BUCKETS ────────────────────────────────────────────────────────────────
// Lower bucket = higher priority. Admin-curated keyword matches always win.
const BUCKET_KEYWORD_MATCH = 0; // Admin tagged this product for the search term
const BUCKET_PRIMARY = 1;
const BUCKET_ACCESSORY = 2;
const BUCKET_OTHER = 3;
const BUCKET_NONE = 4;

// ─── ACCESSORY KEYWORDS ─────────────────────────────────────────────────────
/** Words that, when present in the product name, signal an accessory/part. */
const ACCESSORY_KEYWORDS = new Set([
  "charger", "charging", "battery", "case", "cover", "screen", "protector",
  "stand", "holder", "cable", "cord", "adapter", "mount", "sleeve", "bag",
  "skin", "dock", "hub", "cooler", "cooling", "pad", "mat", "stylus", "pen",
  "strap", "band", "replacement", "spare", "part", "repair", "tool", "kit",
  "accessory", "accessories", "fan", "hinge", "key", "keys", "keycap",
  "ribbon", "flex", "module", "panel", "lcd", "bezel", "palmrest", "trackpad",
  "touchpad", "speaker", "speakers", "webcam", "camera",
  // Generic add-ons that aren't the device itself
  "headset", "headphones", "earbuds", "earphones",
]);

/** Words that count as the "device itself" — kept separate from accessories. */
const DEVICE_NOUNS = new Set([
  "laptop", "laptops", "notebook", "notebooks", "ultrabook", "ultrabooks",
  "computer", "computers", "pc", "desktop", "desktops",
  "phone", "phones", "smartphone", "smartphones", "mobile",
  "tablet", "tablets", "ipad",
  "tv", "television", "televisions", "monitor", "monitors",
  "camera", "cameras", "printer", "printers",
  "watch", "watches", "smartwatch",
]);

// ─── UTILS ──────────────────────────────────────────────────────────────────
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tokenize = (s: string) => s.toLowerCase().split(/[\s\-_/.,()]+/).filter(Boolean);
const hasWholeWord = (text: string, word: string) =>
  !!word && new RegExp(`\\b${escapeRegex(word)}s?\\b`, "i").test(text);

function expandTerm(term: string): string[] {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const variants = new Set<string>([t]);
  if (t.endsWith("s")) variants.add(t.slice(0, -1));
  else variants.add(t + "s");
  return [...variants];
}

/** Does the product NAME contain an accessory keyword (anywhere)? */
function nameHasAccessoryWord(nameTokens: string[]): boolean {
  return nameTokens.some((w) => ACCESSORY_KEYWORDS.has(w));
}

/**
 * Does any category segment match the search term as a whole word?
 * Categories are stored as "Parent > Child".
 */
function categoryMatches(categories: string, terms: string[]): boolean {
  if (!categories) return false;
  const segments = categories.split(/\s*>\s*/);
  return segments.some((seg) => terms.some((t) => hasWholeWord(seg, t)));
}

/**
 * Does the product NAME contain the search term as a whole word?
 * (Plurals already covered by hasWholeWord's trailing s?.)
 */
function nameContainsTerm(name: string, terms: string[]): boolean {
  return terms.some((t) => hasWholeWord(name, t));
}

// ─── CLASSIFICATION ─────────────────────────────────────────────────────────
/**
 * Decide which bucket a product belongs to for the given search term.
 *
 * PRIMARY: looks like the actual searched device.
 *   - Name contains the search term AS A WHOLE WORD AND
 *     name has no accessory keyword → clearly the device itself.
 *   - OR category matches AND name has no accessory keyword.
 *
 * ACCESSORY: relates to the searched device but is a part/add-on.
 *   - Name has an accessory keyword AND
 *     (name OR category contains the search term).
 *
 * OTHER: matched only by description / weak signals.
 * NONE:  no match at all (filtered out by the search query upstream, but safe).
 */
function classify(product: Product, terms: string[]): number {
  const name = (product.name || "").toLowerCase();
  const categories = (product.categories || "").toLowerCase();
  const description = (product.description || "").toLowerCase();
  const nameTokens = tokenize(name);

  // Highest priority: admin-curated search_keywords match
  const keywords = (product.search_keywords || [])
    .filter(Boolean)
    .map((k) => String(k).trim().toLowerCase());
  if (keywords.length > 0) {
    const keywordHit = keywords.some((kw) =>
      terms.some((t) => kw === t || kw.includes(t) || t.includes(kw))
    );
    if (keywordHit) return BUCKET_KEYWORD_MATCH;
  }

  const nameHit = nameContainsTerm(name, terms);
  const catHit = categoryMatches(categories, terms);
  const descHit = terms.some((t) => description.includes(t));
  const accessoryWord = nameHasAccessoryWord(nameTokens);

  if (!nameHit && !catHit && !descHit) return BUCKET_NONE;

  // Accessory if it has an accessory keyword in the name AND relates to the term
  if (accessoryWord && (nameHit || catHit)) {
    return BUCKET_ACCESSORY;
  }

  // Primary: device itself
  if ((nameHit || catHit) && !accessoryWord) {
    return BUCKET_PRIMARY;
  }

  // Edge case: accessory keyword present but no name/category hit → other
  return BUCKET_OTHER;
}

// ─── INTRA-BUCKET SCORING ───────────────────────────────────────────────────
/**
 * Score within a bucket — used only to order items inside the same tier.
 * Higher = better.
 */
function intraBucketScore(product: Product, terms: string[]): number {
  const name = (product.name || "").toLowerCase();
  const categories = (product.categories || "").toLowerCase();
  const nameTokens = tokenize(name);
  let score = 0;

  // Exact name match
  if (terms.some((t) => name === t)) score += 100;

  // Name starts with term
  else if (terms.some((t) => name.startsWith(t))) score += 60;

  // Term is one of the first 2 tokens of the name
  else if (nameTokens.slice(0, 2).some((tok) => terms.includes(tok))) score += 45;

  // Term is a whole word anywhere in name
  else if (terms.some((t) => hasWholeWord(name, t))) score += 30;

  // Term appears as substring in name
  else if (terms.some((t) => name.includes(t))) score += 15;

  // Category match bonus
  if (categoryMatches(categories, terms)) score += 20;

  // Quality signals (tiebreakers)
  score += Math.min((product.rating || 0) * 2, 10);
  score += Math.min((product.reviews_count || 0) * 0.1, 8);
  if (product.featured) score += 5;
  if ((product.stock || 0) > 0) score += 2;

  return score;
}

// ─── PUBLIC API ─────────────────────────────────────────────────────────────
export const scoreSearchRelevance = (product: Product, searchTerm: string): number => {
  const terms = expandTerm(searchTerm);
  if (!terms.length) return 0;
  const bucket = classify(product, terms);
  // Encode bucket + score so callers can sort by a single number.
  // Lower bucket dominates; intra-bucket score is the fractional/secondary part.
  return (BUCKET_NONE - bucket) * 1000 + intraBucketScore(product, terms);
};

/**
 * Sort products: primary devices first, then accessories, then weak matches.
 * Within each bucket, sort by relevance + quality.
 */
export const sortBySearchRelevance = (
  products: Product[],
  searchTerm: string
): Product[] => {
  const terms = expandTerm(searchTerm);
  if (!terms.length || products.length === 0) return products;

  const decorated = products.map((p) => ({
    p,
    bucket: classify(p, terms),
    score: intraBucketScore(p, terms),
  }));

  decorated.sort((a, b) => {
    // 1. Bucket order (primary < accessory < other)
    if (a.bucket !== b.bucket) return a.bucket - b.bucket;
    // 2. Intra-bucket score
    if (b.score !== a.score) return b.score - a.score;
    // 3. Featured tiebreaker
    if (!!a.p.featured !== !!b.p.featured) return a.p.featured ? -1 : 1;
    // 4. Newer first
    return (
      new Date(b.p.created_at || 0).getTime() -
      new Date(a.p.created_at || 0).getTime()
    );
  });

  return decorated.map((d) => d.p);
};
