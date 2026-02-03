import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Product {
  product_id: string;
  name: string;
  price: number;
  discount_price?: number;
  categories?: string;
  rating?: number;
  reviews_count?: number;
  featured?: boolean;
  created_at?: string;
  display_order?: number;
  stock?: number;
}

interface UserIntent {
  viewedCategories: string[];
  viewedProducts: string[];
  searchedTerms: string[];
  cartProductIds: string[];
  wishlistProductIds: string[];
  purchasedCategories?: string[];
  timeOfDay?: string;
  deviceType?: string;
  sessionDuration?: number;
}

interface ScoredProduct extends Product {
  relevance_score: number;
  ai_boost?: number;
  personalization_reason?: string;
}

// Time-based scoring adjustments
function getTimeBasedBoost(timeOfDay?: string): Record<string, number> {
  const hour = new Date().getHours();
  const boosts: Record<string, number> = {};
  
  // Morning (6-11): boost breakfast, fitness, productivity items
  if (hour >= 6 && hour < 11) {
    boosts["Food & Beverages"] = 15;
    boosts["Sports & Fitness"] = 10;
    boosts["Electronics"] = 5;
  }
  // Afternoon (11-17): general shopping time
  else if (hour >= 11 && hour < 17) {
    boosts["Fashion"] = 10;
    boosts["Home & Living"] = 10;
  }
  // Evening (17-22): entertainment, home items
  else if (hour >= 17 && hour < 22) {
    boosts["Electronics"] = 15;
    boosts["Home & Living"] = 12;
    boosts["Entertainment"] = 10;
  }
  // Night (22-6): minimal boosts
  
  return boosts;
}

// Calculate engagement score based on user behavior
function calculateEngagementScore(product: Product, intent: UserIntent): number {
  let score = 0;
  
  // Strong signals
  if (intent.wishlistProductIds?.includes(product.product_id)) {
    score += 80; // Very high intent
  }
  if (intent.cartProductIds?.includes(product.product_id)) {
    score += 70; // High purchase intent (but might be abandoned)
  }
  
  // Category affinity (weighted by recency - more recent = higher weight)
  const categoryMatch = intent.viewedCategories?.findIndex(
    (c) => product.categories?.toLowerCase().includes(c.toLowerCase())
  );
  if (categoryMatch !== undefined && categoryMatch !== -1) {
    // More recent views (lower index) get higher scores
    score += Math.max(40 - categoryMatch * 5, 10);
  }
  
  // Previously purchased categories (repeat customer behavior)
  if (intent.purchasedCategories?.some(
    (c) => product.categories?.toLowerCase().includes(c.toLowerCase())
  )) {
    score += 35;
  }
  
  // Recently viewed product (but not in cart/wishlist - might need reminding)
  if (intent.viewedProducts?.includes(product.product_id)) {
    const viewIndex = intent.viewedProducts.indexOf(product.product_id);
    score += Math.max(25 - viewIndex * 3, 5);
  }
  
  // Search term relevance
  if (intent.searchedTerms?.some(
    (term) => product.name?.toLowerCase().includes(term.toLowerCase())
  )) {
    score += 30;
  }
  
  return score;
}

// Calculate product quality score
function calculateQualityScore(product: Product): number {
  let score = 0;
  
  // Rating score (0-25 points)
  score += Math.round((product.rating || 0) * 5);
  
  // Review count (social proof, 0-20 points)
  const reviews = product.reviews_count || 0;
  if (reviews > 100) score += 20;
  else if (reviews > 50) score += 15;
  else if (reviews > 20) score += 10;
  else if (reviews > 5) score += 5;
  
  // Featured products get a boost
  if (product.featured) score += 15;
  
  // In-stock preference
  if (product.stock && product.stock > 10) score += 5;
  else if (product.stock && product.stock > 0) score += 2;
  
  // Discount attractiveness
  if (product.discount_price && product.price) {
    const discountPercent = ((product.price - product.discount_price) / product.price) * 100;
    if (discountPercent >= 30) score += 15;
    else if (discountPercent >= 20) score += 10;
    else if (discountPercent >= 10) score += 5;
  }
  
  return score;
}

// AI-enhanced scoring using Lovable AI for complex personalization
async function getAIEnhancedScores(
  products: Product[],
  intent: UserIntent
): Promise<Map<string, { boost: number; reason: string }>> {
  const aiScores = new Map<string, { boost: number; reason: string }>();
  
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  // If no API key or minimal intent data, skip AI enhancement
  if (!LOVABLE_API_KEY || 
      (!intent.viewedCategories?.length && 
       !intent.searchedTerms?.length && 
       !intent.cartProductIds?.length)) {
    return aiScores;
  }
  
  try {
    // Prepare a summary for AI analysis (limit to top candidates)
    const topProducts = products.slice(0, 20).map(p => ({
      id: p.product_id,
      name: p.name,
      category: p.categories,
      price: p.price,
      rating: p.rating,
    }));
    
    const userProfile = {
      interests: intent.viewedCategories?.slice(0, 5) || [],
      searches: intent.searchedTerms?.slice(0, 5) || [],
      cartItems: intent.cartProductIds?.length || 0,
      wishlistItems: intent.wishlistProductIds?.length || 0,
    };
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a product recommendation AI. Analyze user behavior and product data to identify the top 5 most relevant products. Return ONLY a JSON array with product IDs and boost scores.`,
          },
          {
            role: "user",
            content: `User profile: ${JSON.stringify(userProfile)}
Products: ${JSON.stringify(topProducts)}

Return JSON array: [{"id": "product_id", "boost": 10-50, "reason": "brief reason"}]
Only include products that strongly match user interests. Max 5 products.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_products",
              description: "Return personalized product recommendations with boost scores",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        boost: { type: "number" },
                        reason: { type: "string" }
                      },
                      required: ["id", "boost", "reason"]
                    }
                  }
                },
                required: ["recommendations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "recommend_products" } }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        const recommendations = parsed.recommendations || [];
        
        for (const rec of recommendations) {
          if (rec.id && typeof rec.boost === 'number') {
            aiScores.set(rec.id, {
              boost: Math.min(rec.boost, 50), // Cap at 50
              reason: rec.reason || "AI recommended"
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("AI enhancement failed, continuing without:", err);
  }
  
  return aiScores;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { products, intent, useAI = true } = await req.json();

    if (!Array.isArray(products)) {
      return new Response(
        JSON.stringify({ error: "Invalid products payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Smart sort processing ${products.length} products with intent:`, {
      viewedCategories: intent?.viewedCategories?.length || 0,
      viewedProducts: intent?.viewedProducts?.length || 0,
      searchedTerms: intent?.searchedTerms?.length || 0,
      cartItems: intent?.cartProductIds?.length || 0,
      wishlistItems: intent?.wishlistProductIds?.length || 0,
    });

    // Get time-based category boosts
    const timeBoosts = getTimeBasedBoost(intent?.timeOfDay);
    
    // Get AI-enhanced scores (only for meaningful intent data)
    let aiScores = new Map<string, { boost: number; reason: string }>();
    if (useAI && intent && products.length > 0) {
      aiScores = await getAIEnhancedScores(products, intent);
    }

    // Score all products
    const scored: ScoredProduct[] = products.map((product: Product) => {
      let score = 0;
      
      // 1. Engagement score (user behavior signals)
      score += calculateEngagementScore(product, intent || {});
      
      // 2. Quality score (product attributes)
      score += calculateQualityScore(product);
      
      // 3. Time-based category boost
      for (const [category, boost] of Object.entries(timeBoosts)) {
        if (product.categories?.toLowerCase().includes(category.toLowerCase())) {
          score += boost;
        }
      }
      
      // 4. AI-enhanced boost
      const aiEnhancement = aiScores.get(product.product_id);
      const aiBoost = aiEnhancement?.boost || 0;
      score += aiBoost;
      
      // 5. Freshness bonus (newer products get slight boost)
      if (product.created_at) {
        const daysSinceCreated = (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated < 7) score += 10;
        else if (daysSinceCreated < 30) score += 5;
      }

      return {
        ...product,
        relevance_score: score,
        ai_boost: aiBoost,
        personalization_reason: aiEnhancement?.reason,
      };
    });

    // Sort by relevance score, then display_order, then created_at
    scored.sort((a, b) => {
      // Primary: relevance score
      if (b.relevance_score !== a.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      
      // Secondary: display order (admin-defined priority)
      if (a.display_order !== b.display_order) {
        return (a.display_order ?? 9999) - (b.display_order ?? 9999);
      }
      
      // Tertiary: newest first
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });

    console.log(`Smart sort complete. Top 3 scores:`, 
      scored.slice(0, 3).map(p => ({ 
        name: p.name?.substring(0, 30), 
        score: p.relevance_score,
        aiBoost: p.ai_boost 
      }))
    );

    return new Response(JSON.stringify(scored), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Smart sort error:", err);
    return new Response(
      JSON.stringify({ error: "Smart sort failed", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
