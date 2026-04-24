import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Fetches the logged-in user's purchase history (delivered/completed orders)
 * and exposes:
 *   - productIds: products they already own (used to de-prioritize them)
 *   - categories: categories they've purchased from (used as CF proxy boost)
 *
 * The result is also written to a module-level cache that productQueries.ts
 * reads synchronously inside its smart-sort fallback.
 */

type PurchaseHistory = {
  productIds: string[];
  categories: string[];
};

let purchaseHistoryCache: PurchaseHistory = { productIds: [], categories: [] };

export const getPurchaseHistoryCache = (): PurchaseHistory => purchaseHistoryCache;

const PURCHASED_STATUSES = new Set([
  'delivered',
  'completed',
  'paid',
  'shipped',
  'fulfilled',
]);

const fetchPurchaseHistory = async (userId: string): Promise<PurchaseHistory> => {
  const { data, error } = await supabase
    .from('orders')
    .select('items, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('Failed to fetch purchase history:', error);
    return { productIds: [], categories: [] };
  }

  const productIds = new Set<string>();
  for (const order of data || []) {
    const status = (order.status || '').toLowerCase();
    if (!PURCHASED_STATUSES.has(status)) continue;
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      const pid = (item as any)?.product?.id || (item as any)?.product_id || (item as any)?.id;
      if (pid && typeof pid === 'string') productIds.add(pid);
    }
  }

  // Look up categories for those products in one query
  let categories: string[] = [];
  if (productIds.size > 0) {
    const { data: prods } = await supabase
      .from('products')
      .select('categories')
      .in('product_id', Array.from(productIds));
    const catSet = new Set<string>();
    for (const p of prods || []) {
      if (p.categories) {
        // Take the main category (before any '>')
        const main = String(p.categories).split('>')[0]?.trim();
        if (main) catSet.add(main);
        catSet.add(p.categories);
      }
    }
    categories = Array.from(catSet);
  }

  return { productIds: Array.from(productIds), categories };
};

export const useUserPurchaseHistory = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['user-purchase-history', userId],
    queryFn: () => fetchPurchaseHistory(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  // Mirror to module cache so productQueries.ts can read synchronously
  useEffect(() => {
    if (query.data) {
      purchaseHistoryCache = query.data;
    } else if (!userId) {
      purchaseHistoryCache = { productIds: [], categories: [] };
    }
  }, [query.data, userId]);

  return query;
};

export default useUserPurchaseHistory;
