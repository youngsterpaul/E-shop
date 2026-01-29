import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const { products, intent } = await req.json();

    if (!Array.isArray(products)) {
      return new Response(
        JSON.stringify({ error: "Invalid products payload" }),
        { status: 400 }
      );
    }

    const scored = products.map((product) => {
      let score = 0;

      // Category affinity
      if (
        intent?.viewedCategories?.some((c: string) =>
          product.categories?.includes(c)
        )
      ) score += 30;

      // Viewed before
      if (intent?.viewedProducts?.includes(product.product_id)) {
        score += 20;
      }

      // Cart signal
      if (intent?.cartProductIds?.includes(product.product_id)) {
        score += 50;
      }

      // Wishlist signal
      if (intent?.wishlistProductIds?.includes(product.product_id)) {
        score += 60;
      }

      // Search relevance
      if (
        intent?.searchedTerms?.some((t: string) =>
          product.name?.toLowerCase().includes(t.toLowerCase())
        )
      ) score += 25;

      // Popularity
      score += Math.min(product.reviews_count || 0, 20);

      // Rating boost
      score += Math.round((product.rating || 0) * 5);

      // Featured boost (small)
      if (product.featured) score += 10;

      return {
        ...product,
        relevance_score: score,
      };
    });

    scored.sort((a, b) => {
      if (b.relevance_score !== a.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }

      if (a.display_order !== b.display_order) {
        return (a.display_order ?? 9999) - (b.display_order ?? 9999);
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

    return new Response(JSON.stringify(scored), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Smart sort failed", details: String(err) }),
      { status: 500 }
    );
  }
});
