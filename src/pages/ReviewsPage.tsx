import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Edit3, Package, MessageSquare, ChevronRight, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface OrderItem {
  product_id?: string;
  productId?: string;
  id?: string;
  name?: string;
  product_name?: string;
  image_url?: string;
  image?: string;
  quantity?: number;
  price?: number;
  product?: {
    id?: string;
    product_id?: string;
    name?: string;
    image?: string;
    image_url?: string;
    image_urls?: string[];
  };
}

interface PendingReviewProduct {
  product_id: string;
  name: string;
  image: string | null;
  order_id: string;
  delivered_at: string;
}

interface UserReview {
  review_id: string;
  product_id: string;
  rating: number;
  comment: string;
  media_urls: string[];
  created_at: string | null;
  product?: {
    name: string;
    image_urls: string[] | null;
  } | null;
}

const ReviewsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<'pending' | 'reviewed'>('pending');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const { data: pendingReviews = [], isLoading: loadingPending } = useQuery<PendingReviewProduct[]>({
    queryKey: ['pending-reviews', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('order_id, items, updated_at, status')
        .eq('user_id', user!.id)
        .eq('status', 'delivered')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const productMap = new Map<string, PendingReviewProduct>();
      (orders || []).forEach((order) => {
        const items = (order.items as OrderItem[] | null) || [];
        items.forEach((item) => {
          // Real product info is usually nested under item.product
          const nested = item.product || {};
          const pid =
            nested.product_id ||
            nested.id ||
            item.product_id ||
            item.productId;
          if (!pid || productMap.has(pid)) return;
          const name =
            nested.name || item.name || item.product_name || 'Product';
          const image =
            nested.image ||
            nested.image_url ||
            (Array.isArray(nested.image_urls) ? nested.image_urls[0] : null) ||
            item.image_url ||
            item.image ||
            null;
          productMap.set(pid, {
            product_id: pid,
            name,
            image,
            order_id: order.order_id,
            delivered_at: order.updated_at,
          });
        });
      });

      const productIds = Array.from(productMap.keys());
      if (productIds.length === 0) return [];

      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('product_id')
        .eq('user_id', user!.id)
        .in('product_id', productIds);

      const reviewedSet = new Set((existingReviews || []).map((r) => r.product_id));
      return Array.from(productMap.values()).filter((p) => !reviewedSet.has(p.product_id));
    },
  });

  const { data: userReviews = [], isLoading: loadingReviews } = useQuery<UserReview[]>({
    queryKey: ['user-reviews', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('review_id, product_id, rating, comment, media_urls, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productIds = (data || []).map((r) => r.product_id);
      const productsMap = new Map<string, { name: string; image_urls: string[] | null }>();
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('product_id, name, image_urls')
          .in('product_id', productIds);
        (products || []).forEach((p) => {
          productsMap.set(p.product_id, { name: p.name, image_urls: p.image_urls });
        });
      }

      return (data || []).map((r) => ({
        ...r,
        media_urls: (r.media_urls as string[]) || [],
        product: productsMap.get(r.product_id) || null,
      }));
    },
  });

  const counts = useMemo(
    () => ({ pending: pendingReviews.length, reviewed: userReviews.length }),
    [pendingReviews, userReviews]
  );

  const avgRating = useMemo(() => {
    if (!userReviews.length) return 0;
    return userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
  }, [userReviews]);

  const isLoading = tab === 'pending' ? loadingPending : loadingReviews;

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">My Reviews</h1>
        </div>

        {/* Tabs */}
        <div className="flex px-2">
          {([
            { key: 'pending', label: 'To Review', count: counts.pending },
            { key: 'reviewed', label: 'My Reviews', count: counts.reviewed },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 relative py-3 text-sm font-medium transition-colors ${
                tab === t.key ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {t.label}
                {t.count > 0 && (
                  <span
                    className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-semibold rounded-full ${
                      tab === t.key
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </span>
              {tab === t.key && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-destructive rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats banner — only on reviewed tab with reviews */}
      {tab === 'reviewed' && userReviews.length > 0 && !loadingReviews && (
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-br from-primary/5 via-background to-background border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Your Impact
                </p>
                <p className="text-2xl font-bold mt-0.5">{userReviews.length} {userReviews.length === 1 ? 'Review' : 'Reviews'}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Average rating</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
              <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-9 w-28 rounded-lg mt-2" />
              </div>
            </div>
          ))
        ) : tab === 'pending' ? (
          pendingReviews.length === 0 ? (
            <EmptyState
              icon={<Package className="h-9 w-9 text-primary" />}
              title="All caught up!"
              description="You've reviewed all your delivered items. Check back after your next order arrives."
              actionLabel="View Orders"
              onAction={() => navigate('/orders')}
            />
          ) : (
            <>
              <p className="text-xs text-muted-foreground px-1 mb-1">
                Share your experience and earn rewards
              </p>
              {pendingReviews.map((p) => (
                <button
                  key={p.product_id}
                  onClick={() => navigate(`/products/${p.product_id}/review`)}
                  className="w-full bg-card border border-border rounded-2xl p-3 flex gap-3 items-center hover:border-primary/40 hover:shadow-sm transition-all text-left group"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-7 w-7 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2 leading-snug">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Delivered {formatDistanceToNow(new Date(p.delivered_at), { addSuffix: true })}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-muted-foreground/30 group-hover:text-yellow-400/60 transition-colors"
                        />
                      ))}
                      <span className="text-[11px] text-primary font-medium ml-1">Rate now</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </>
          )
        ) : userReviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-9 w-9 text-primary" />}
            title="No reviews yet"
            description="Your published reviews will appear here. Start by reviewing your delivered orders."
            actionLabel="See Pending"
            onAction={() => setTab('pending')}
          />
        ) : (
          userReviews.map((r) => (
            <article
              key={r.review_id}
              className="bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex gap-3">
                <Link
                  to={`/product/${generateSlug(r.product?.name || 'product')}/${r.product_id}`}
                  className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 hover:opacity-90 transition-opacity"
                >
                  {r.product?.image_urls?.[0] ? (
                    <img
                      src={r.product.image_urls[0]}
                      alt={r.product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${generateSlug(r.product?.name || 'product')}/${r.product_id}`}
                    className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors"
                  >
                    {r.product?.name || 'Product'}
                  </Link>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < r.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground/25'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : ''}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(`/products/${r.product_id}/review`, {
                      state: {
                        existingReview: {
                          review_id: r.review_id,
                          rating: r.rating,
                          comment: r.comment,
                          media_urls: r.media_urls,
                        },
                      },
                    })
                  }
                  className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center shrink-0 transition-colors"
                  aria-label="Edit review"
                >
                  <Edit3 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {r.comment && (
                <p className="text-sm text-foreground/80 mt-3 leading-relaxed line-clamp-3">
                  {r.comment}
                </p>
              )}

              {r.media_urls.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none -mx-1 px-1">
                  {r.media_urls.slice(0, 5).map((url, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {i === 4 && r.media_urls.length > 5 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            +{r.media_urls.length - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {r.media_urls.length > 0 && (
                    <div className="absolute -mt-1 ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-background/90 rounded text-[10px] text-muted-foreground pointer-events-none">
                      <Camera className="h-3 w-3" />
                      {r.media_urls.length}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
};

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center text-center py-20 px-6">
    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
      {icon}
    </div>
    <h3 className="font-semibold text-base">{title}</h3>
    <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
      {description}
    </p>
    {actionLabel && onAction && (
      <Button onClick={onAction} variant="outline" className="mt-5 rounded-full px-6">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default ReviewsPage;
