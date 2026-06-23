import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Star,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
  MessageSquare,
  Settings,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { useProductReviews } from '@/hooks/useReviews';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ProductTabsProps {
  product: {
    product_id: string;
    name: string;
    features?: string[] | string;
    attributes?: Record<string, any>;
    specification?: Record<string, any>;
  };
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const [activeTab, setActiveTab]               = useState('specs');
  const [isSticky, setIsSticky]                 = useState(false);
  const [originalTop, setOriginalTop]           = useState(0);
  const [expandedSpecs, setExpandedSpecs]       = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState(false);
  const [expandedReviews, setExpandedReviews]   = useState(false);
  const [reviewFilter, setReviewFilter]         = useState('all');

  const tabsRef     = useRef<HTMLDivElement>(null);
  const specsRef    = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const reviewsRef  = useRef<HTMLDivElement>(null);

  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(product.product_id);
  const isMobile = isMobileUserAgent();

  const HEADER_OFFSET = isMobile ? 48 : 0;

  /* ── Parse features ─────────────────────────────────────────────────────── */
  const features = useMemo(() => {
    if (!product.features) return [];
    if (typeof product.features === 'string') {
      try { return JSON.parse(product.features); } catch { return [product.features]; }
    }
    return Array.isArray(product.features) ? product.features : [];
  }, [product.features]);

  const specs       = product.specification || product.attributes || {};
  const specEntries = Object.entries(specs);

  /* ── Reviews stats ──────────────────────────────────────────────────────── */
  const filteredReviews = reviewFilter === 'all'
    ? reviews
    : reviews.filter((r) => r.rating === parseInt(reviewFilter));

  const totalReviews  = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0;

  const ratingDist = useMemo(() => {
    const d: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => { d[Math.round(r.rating)] = (d[Math.round(r.rating)] || 0) + 1; });
    return d;
  }, [reviews]);

  /* ── Limits ─────────────────────────────────────────────────────────────── */
  const SPECS_LIMIT    = isMobile ? 5 : 10;
  const FEATURES_LIMIT = isMobile ? 4 : 8;
  const REVIEWS_LIMIT  = isMobile ? 2 : 4;

  const visibleSpecs    = expandedSpecs    ? specEntries      : specEntries.slice(0, SPECS_LIMIT);
  const visibleFeatures = expandedFeatures ? features         : features.slice(0, FEATURES_LIMIT);
  const visibleReviews  = expandedReviews  ? filteredReviews  : filteredReviews.slice(0, REVIEWS_LIMIT);

  /* ── Store original tabs top ─────────────────────────────────────────────── */
  useEffect(() => {
    if (tabsRef.current && !originalTop) {
      const rect = tabsRef.current.getBoundingClientRect();
      setOriginalTop(rect.top + window.pageYOffset);
    }
  }, [originalTop]);

  /* ── Sticky scroll handler ──────────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      if (!originalTop) return;
      setIsSticky(window.pageYOffset >= originalTop - HEADER_OFFSET);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [originalTop, HEADER_OFFSET]);

  /* ── Section spy ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveTab(e.target.id); }),
      { rootMargin: '-25% 0px -65% 0px', threshold: 0 }
    );
    [specsRef, featuresRef, reviewsRef].forEach((r) => r.current && observer.observe(r.current));
    return () => observer.disconnect();
  }, []);

  /* ── Scroll to section ──────────────────────────────────────────────────── */
  const scrollTo = useCallback((id: string) => {
    const map: Record<string, React.RefObject<HTMLDivElement>> = {
      specs: specsRef, features: featuresRef, reviews: reviewsRef,
    };
    const el = map[id]?.current;
    if (!el) return;
    const tabH = tabsRef.current?.offsetHeight ?? 44;
    window.scrollTo({ top: el.offsetTop - HEADER_OFFSET - tabH - 16, behavior: 'smooth' });
    setActiveTab(id);
  }, [HEADER_OFFSET]);

  const tabsHeight = tabsRef.current?.offsetHeight ?? 44;

  return (
    <div className="w-full bg-card.">

      {/* ── STICKY PLACEHOLDER ─────────────────────────────────────────────── */}
      {isSticky && <div style={{ height: tabsHeight }} />}

      {/* ── TAB NAV ────────────────────────────────────────────────────────── */}
      <div
        ref={tabsRef}
        className={cn(
          'bg-white z-40 transition-shadow duration-200',
          isSticky
            ? 'fixed left-0 right-0 border-b border-gray-200 shadow-sm'
            : 'border-b border-gray-200'
        )}
        style={isSticky ? { top: HEADER_OFFSET } : {}}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-11 md:h-12">

            {/* Tab buttons */}
            {[
              { id: 'specs',    label: 'Specifications', short: 'Specs'   },
              { id: 'features', label: 'Features',       short: 'Features'},
              { id: 'reviews',  label: `Reviews (${totalReviews})`, short: 'Reviews'},
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollTo(tab.id)}
                className={cn(
                  'relative h-full px-4 md:px-5 text-[12px] md:text-[13px] font-semibold tracking-wide transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-800'
                )}
              >
                <span className="md:hidden">{tab.short}</span>
                <span className="hidden md:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-t" />
                )}
              </button>
            ))}

            {/* Rating chip — desktop only */}
            {!isMobile && totalReviews > 0 && (
              <div className="ml-auto flex items-center gap-1.5 text-[12px] text-gray-500 pr-1">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-gray-700">{averageRating.toFixed(1)}</span>
                <span className="text-gray-400 font-medium">/ 5</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* ═══ SPECIFICATIONS ════════════════════════════════════════════════ */}
        <div
          id="specs"
          ref={specsRef}
          className="pt-7 pb-9 md:pt-9 md:pb-12 border-b border-gray-100"
        >
          {/* Section heading */}
          <div className="flex items-center gap-2 mb-4 md:mb-5">
            <Settings size={13} className="text-gray-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Specifications
            </span>
            {specEntries.length > 0 && (
              <span className="text-[11px] text-gray-300">— {specEntries.length} items</span>
            )}
          </div>

          {specEntries.length > 0 ? (
            <>
              <div className="rounded-md border border-gray-100 overflow-hidden">
                <dl>
                  {visibleSpecs.map(([key, value], i) => (
                    <div
                      key={key}
                      className={cn(
                        'grid grid-cols-[110px_1fr] md:grid-cols-[200px_1fr] border-b border-gray-50 last:border-0 transition-colors hover:bg-blue-50/30',
                        i % 2 === 0 ? 'bg-background' : 'bg-gray-50/40'
                      )}
                    >
                      <dt className="px-3 py-2.5 md:px-4 md:py-3 text-[10.5px] md:text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100 self-start leading-relaxed">
                        {key.replace(/[_-]/g, ' ')}
                      </dt>
                      <dd className="px-3 py-2.5 md:px-4 md:py-3 text-[12.5px] md:text-[13px] text-gray-800 font-medium leading-relaxed break-words">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {specEntries.length > SPECS_LIMIT && (
                <button
                  onClick={() => setExpandedSpecs(!expandedSpecs)}
                  className="mt-3.5 flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:underline underline-offset-2"
                >
                  {expandedSpecs
                    ? <><ChevronUp size={13} />Show fewer specifications</>
                    : <><ChevronDown size={13} />View all {specEntries.length} specifications</>}
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-12 rounded-lg border border-dashed border-gray-100">
              <AlertCircle size={26} className="text-gray-200 mb-3" />
              <p className="text-[12.5px] text-gray-400">No specifications available.</p>
            </div>
          )}
        </div>

        {/* ═══ FEATURES ══════════════════════════════════════════════════════ */}
        <div
          id="features"
          ref={featuresRef}
          className="pt-7 pb-9 md:pt-9 md:pb-12 border-b border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4 md:mb-5">
            <Layers size={13} className="text-gray-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Key Features
            </span>
            {features.length > 0 && (
              <span className="text-[11px] text-gray-300">— {features.length} items</span>
            )}
          </div>

          {features.length > 0 ? (
            <>
              <div className="rounded-md border border-gray-100 overflow-hidden">
                {visibleFeatures.map((feature: string, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-stretch border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors',
                      i % 2 === 0 ? 'bg-background' : 'bg-gray-50/40'
                    )}
                  >
                    {/* Row number */}
                    <span className="shrink-0 w-9 md:w-11 flex items-center justify-center text-[11px] md:text-[12px] font-bold text-blue-500 bg-blue-50/60 border-r border-gray-100">
                      {i + 1}
                    </span>
                    {/* Feature text */}
                    <p className="px-3 py-2.5 md:px-4 md:py-3 text-[12.5px] md:text-[13px] text-gray-800 font-medium leading-relaxed">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>

              {features.length > FEATURES_LIMIT && (
                <button
                  onClick={() => setExpandedFeatures(!expandedFeatures)}
                  className="mt-3.5 flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:underline underline-offset-2"
                >
                  {expandedFeatures
                    ? <><ChevronUp size={13} />Show fewer features</>
                    : <><ChevronDown size={13} />Show {features.length - FEATURES_LIMIT} more features</>}
                </button>
              )}

              {/* Trust badges */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { icon: <ShieldCheck size={11} />, label: 'Quality Guaranteed' },
                  { icon: <Zap size={11} />,         label: 'High Performance'   },
                  { icon: <AlertCircle size={11} />, label: 'Verified Product'   },
                ].map(({ icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 text-[11px] font-semibold text-gray-500"
                  >
                    <span className="text-blue-400">{icon}</span>
                    {label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-12 rounded-lg border border-dashed border-gray-100">
              <AlertCircle size={26} className="text-gray-200 mb-3" />
              <p className="text-[12.5px] text-gray-400">No features listed.</p>
            </div>
          )}
        </div>

        {/* ═══ REVIEWS ═══════════════════════════════════════════════════════ */}
        <div
          id="reviews"
          ref={reviewsRef}
          className="pt-7 pb-14 md:pt-9 md:pb-20"
        >
          <div className="flex items-center gap-2 mb-4 md:mb-5">
            <Star size={13} className="text-gray-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Customer Reviews
            </span>
          </div>

          {/* Rating summary card */}
          {totalReviews > 0 && (
            <div className="rounded-md border border-gray-100 bg-gray-50/40 p-4 md:p-5 mb-5">
              <div className="flex flex-col sm:flex-row gap-5 md:gap-8">

                {/* Score */}
                <div className="flex flex-col items-center justify-center sm:border-r sm:border-gray-200 sm:pr-8 shrink-0">
                  <span className="text-[42px] md:text-[46px] font-black text-gray-900 leading-none tabular-nums">
                    {averageRating.toFixed(1)}
                  </span>
                  <div className="flex gap-0.5 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium mt-1.5 tabular-nums">
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </p>
                </div>

                {/* Distribution bars — clickable as filter shortcut */}
                <div className="flex-1 space-y-1.5 justify-center flex flex-col">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const pct = totalReviews > 0
                      ? Math.round(((ratingDist[star] ?? 0) / totalReviews) * 100)
                      : 0;
                    const active = reviewFilter === String(star);
                    return (
                      <button
                        key={star}
                        onClick={() => setReviewFilter(active ? 'all' : String(star))}
                        className="flex items-center gap-3 group w-full"
                      >
                        <span className={cn(
                          'text-[11.5px] font-semibold w-7 text-right shrink-0 transition-colors',
                          active ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'
                        )}>
                          {star}★
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              active ? 'bg-blue-500' : 'bg-yellow-400'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-400 w-6 shrink-0 text-left tabular-nums">
                          {ratingDist[star] ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Filter pills */}
          {totalReviews > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-5">
              <Filter size={11} className="text-gray-400 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-400 mr-0.5">Filter:</span>
              {['all', '5', '4', '3', '2', '1'].map((f) => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors',
                    reviewFilter === f
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-500'
                  )}
                >
                  {f === 'all' ? 'All' : `${f}★`}
                </button>
              ))}
            </div>
          )}

          {/* Review list */}
          {reviewsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-gray-50 animate-pulse" />
              ))}
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="space-y-3">
              {visibleReviews.map((review) => (
                <ReviewCard key={review.review_id} review={review} />
              ))}
              {filteredReviews.length > REVIEWS_LIMIT && (
                <button
                  onClick={() => setExpandedReviews(!expandedReviews)}
                  className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:underline underline-offset-2"
                >
                  {expandedReviews
                    ? <><ChevronUp size={13} />Show fewer reviews</>
                    : <><ChevronDown size={13} />Show {filteredReviews.length - REVIEWS_LIMIT} more reviews</>}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 rounded-xl border-2 border-dashed border-gray-100">
              <MessageSquare size={28} className="text-gray-200 mb-3" />
              <p className="text-[13px] font-semibold text-gray-400">
                {reviewFilter === 'all' ? 'No reviews yet' : `No ${reviewFilter}-star reviews`}
              </p>
              {reviewFilter === 'all' && (
                <p className="text-[11.5px] text-gray-300 mt-1">Be the first to share your experience</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProductTabs;