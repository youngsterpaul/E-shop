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
    <div className="w-full bg-[#faf9f6] text-stone-900 antialiased font-sans">

      {/* ── STICKY PLACEHOLDER ─────────────────────────────────────────────── */}
      {isSticky && <div style={{ height: tabsHeight }} />}

      {/* ── TAB NAV ────────────────────────────────────────────────────────── */}
      <div
        ref={tabsRef}
        className={cn(
          'bg-white z-40 transition-shadow duration-300 border-t border-stone-100',
          isSticky
            ? 'fixed left-0 right-0 border-b border-stone-200 shadow-md backdrop-blur-md bg-white/95'
            : 'border-b border-stone-200'
        )}
        style={isSticky ? { top: HEADER_OFFSET } : {}}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            
            {/* Gem Fashion Style Brand Marker */}
            <div className="mr-6 hidden sm:flex flex-col items-start select-none">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-rose-700 leading-none">Gem Fashion</span>
              <span className="text-[12px] italic tracking-widest text-stone-400 font-serif">Style Edition</span>
            </div>

            {/* Tab buttons */}
            <div className="flex items-center h-full space-x-1">
              {[
                { id: 'specs',    label: 'Specifications', short: 'Specs'   },
                { id: 'features', label: 'Key Curations',  short: 'Curations'},
                { id: 'reviews',  label: `Reviews (${totalReviews})`, short: `Reviews (${totalReviews})`},
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollTo(tab.id)}
                  className={cn(
                    'relative h-full px-4 text-[11px] md:text-[12px] uppercase font-bold tracking-[0.15em] transition-all duration-200 whitespace-nowrap',
                    activeTab === tab.id
                      ? 'text-stone-900 font-extrabold'
                      : 'text-stone-400 hover:text-stone-900'
                  )}
                >
                  <span className="md:hidden">{tab.short}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-rose-700 transition-all duration-300" />
                  )}
                </button>
              ))}
            </div>

            {/* Rating chip — desktop only */}
            {!isMobile && totalReviews > 0 && (
              <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500 pl-4 border-l border-stone-200">
                <Star size={13} className="fill-stone-900 text-stone-900" />
                <span className="font-bold text-stone-900">{averageRating.toFixed(1)}</span>
                <span className="text-stone-300">/ 5.0</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">

        {/* ═══ SPECIFICATIONS ════════════════════════════════════════════════ */}
        <div
          id="specs"
          ref={specsRef}
          className="pt-10 pb-12 md:pt-14 md:pb-16 border-b border-stone-200"
        >
          {/* Section heading */}
          <div className="flex items-baseline justify-between mb-6 md:mb-8 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-3">
              <Settings size={14} className="text-stone-400" />
              <h2 className="text-[13px] font-bold uppercase tracking-[0.25em] text-stone-800">
                Garment Specifications
              </h2>
            </div>
            {specEntries.length > 0 && (
              <span className="text-[11px] font-medium tracking-widest text-stone-400 italic">
                {specEntries.length} details documented
              </span>
            )}
          </div>

          {specEntries.length > 0 ? (
            <>
              <div className="bg-white rounded-none border border-stone-200 shadow-sm overflow-hidden">
                <dl>
                  {visibleSpecs.map(([key, value], i) => (
                    <div
                      key={key}
                      className={cn(
                        'grid grid-cols-[120px_1fr] md:grid-cols-[240px_1fr] border-b border-stone-100 last:border-0 transition-colors hover:bg-stone-50/50',
                        i % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'
                      )}
                    >
                      <dt className="px-4 py-3.5 md:px-6 md:py-4 text-[10px] md:text-[11px] font-bold text-stone-400 uppercase tracking-[0.15em] border-r border-stone-100 self-start leading-relaxed">
                        {key.replace(/[_-]/g, ' ')}
                      </dt>
                      <dd className="px-4 py-3.5 md:px-6 md:py-4 text-[13px] text-stone-800 font-medium leading-relaxed break-words">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {specEntries.length > SPECS_LIMIT && (
                <button
                  onClick={() => setExpandedSpecs(!expandedSpecs)}
                  className="mt-5 flex items-center gap-2 text-[11px] uppercase font-bold tracking-[0.15em] text-rose-700 hover:text-stone-900 transition-colors duration-200"
                >
                  {expandedSpecs
                    ? <><ChevronUp size={14} />View less attributes</>
                    : <><ChevronDown size={14} />View complete manifest ({specEntries.length})</>}
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-16 bg-white border border-stone-200">
              <AlertCircle size={24} className="text-stone-300 mb-3" />
              <p className="text-[12px] font-medium tracking-wide text-stone-400">Specifications dynamically unavailable.</p>
            </div>
          )}
        </div>

        {/* ═══ FEATURES ══════════════════════════════════════════════════════ */}
        <div
          id="features"
          ref={featuresRef}
          className="pt-10 pb-12 md:pt-14 md:pb-16 border-b border-stone-200"
        >
          <div className="flex items-baseline justify-between mb-6 md:mb-8 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-3">
              <Layers size={14} className="text-stone-400" />
              <h2 className="text-[13px] font-bold uppercase tracking-[0.25em] text-stone-800">
                Design & Style Highlights
              </h2>
            </div>
            {features.length > 0 && (
              <span className="text-[11px] font-medium tracking-widest text-stone-400 italic">
                {features.length} points of interest
              </span>
            )}
          </div>

          {features.length > 0 ? (
            <>
              <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
                {visibleFeatures.map((feature: string, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-stretch border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors',
                      i % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'
                    )}
                  >
                    {/* Row Indicator */}
                    <span className="shrink-0 w-12 md:w-16 flex items-center justify-center text-[10px] font-serif font-bold italic text-rose-700 bg-stone-50 border-r border-stone-100 select-none">
                      #{String(i + 1).padStart(2, '0')}
                    </span>
                    {/* Feature text */}
                    <p className="px-4 py-3.5 md:px-6 md:py-4 text-[13px] text-stone-800 font-medium leading-relaxed">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>

              {features.length > FEATURES_LIMIT && (
                <button
                  onClick={() => setExpandedFeatures(!expandedFeatures)}
                  className="mt-5 flex items-center gap-2 text-[11px] uppercase font-bold tracking-[0.15em] text-rose-700 hover:text-stone-900 transition-colors duration-200"
                >
                  {expandedFeatures
                    ? <><ChevronUp size={14} />Collapse highlights</>
                    : <><ChevronDown size={14} />Reveal remaining elements ({features.length - FEATURES_LIMIT})</>}
                </button>
              )}

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { icon: <ShieldCheck size={12} />, label: 'Gem Style Guaranteed' },
                  { icon: <Zap size={12} />,         label: 'Premium Craftsmanship' },
                  { icon: <AlertCircle size={12} />, label: 'Authentic Lineage'   },
                ].map(({ icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-stone-600 shadow-sm"
                  >
                    <span className="text-rose-700">{icon}</span>
                    {label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-16 bg-white border border-stone-200">
              <AlertCircle size={24} className="text-stone-300 mb-3" />
              <p className="text-[12px] font-medium tracking-wide text-stone-400">No specific features logged.</p>
            </div>
          )}
        </div>

        {/* ═══ REVIEWS ═══════════════════════════════════════════════════════ */}
        <div
          id="reviews"
          ref={reviewsRef}
          className="pt-10 pb-16 md:pt-14 md:pb-24"
        >
          <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-stone-100 pb-3">
            <Star size={14} className="text-stone-400" />
            <h2 className="text-[13px] font-bold uppercase tracking-[0.25em] text-stone-800">
              Verified Patron Feedback
            </h2>
          </div>

          {/* Rating summary card */}
          {totalReviews > 0 && (
            <div className="bg-white border border-stone-200 p-6 md:p-8 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 md:gap-12">

                {/* Score */}
                <div className="flex flex-col items-center justify-center md:border-r md:border-stone-100 md:pr-12 shrink-0">
                  <span className="text-[48px] md:text-[54px] font-light tracking-tighter text-stone-900 leading-none tabular-nums">
                    {averageRating.toFixed(1)}
                  </span>
                  <div className="flex gap-0.5 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < Math.round(averageRating)
                            ? 'fill-stone-900 text-stone-900'
                            : 'fill-stone-200 text-stone-200'
                        }
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-3 tabular-nums">
                    {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'} Total
                  </p>
                </div>

                {/* Distribution bars — clickable as filter shortcut */}
                <div className="flex-1 space-y-2 justify-center flex flex-col">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const pct = totalReviews > 0
                      ? Math.round(((ratingDist[star] ?? 0) / totalReviews) * 100)
                      : 0;
                    const active = reviewFilter === String(star);
                    return (
                      <button
                        key={star}
                        onClick={() => setReviewFilter(active ? 'all' : String(star))}
                        className="flex items-center gap-4 group w-full text-left"
                      >
                        <span className={cn(
                          'text-[11px] font-bold tracking-wider w-8 text-right shrink-0 transition-colors',
                          active ? 'text-rose-700' : 'text-stone-500 group-hover:text-stone-900'
                        )}>
                          {star} ★
                        </span>
                        <div className="flex-1 h-1 bg-stone-100 overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-500 ease-out',
                              active ? 'bg-rose-700' : 'bg-stone-900'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-stone-400 w-8 shrink-0 text-left tabular-nums">
                          ({ratingDist[star] ?? 0})
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
            <div className="flex items-center gap-2 flex-wrap mb-6">
              <Filter size={11} className="text-stone-400 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-1">Filter Tier:</span>
              {['all', '5', '4', '3', '2', '1'].map((f) => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={cn(
                    'px-3 py-1 text-[11px] font-bold tracking-wider uppercase border transition-all duration-200',
                    reviewFilter === f
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-900'
                  )}
                >
                  {f === 'all' ? 'Show All' : `${f} Star`}
                </button>
              ))}
            </div>
          )}

          {/* Review list */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white border border-stone-200 animate-pulse" />
              ))}
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="space-y-4">
              {visibleReviews.map((review) => (
                <ReviewCard key={review.review_id} review={review} />
              ))}
              {filteredReviews.length > REVIEWS_LIMIT && (
                <button
                  onClick={() => setExpandedReviews(!expandedReviews)}
                  className="mt-3 flex items-center gap-2 text-[11px] uppercase font-bold tracking-[0.15em] text-rose-700 hover:text-stone-900 transition-colors duration-200"
                >
                  {expandedReviews
                    ? <><ChevronUp size={14} />Show Fewer Reviews</>
                    : <><ChevronDown size={14} />Read More Reviews ({filteredReviews.length - REVIEWS_LIMIT})</>}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 bg-white border-2 border-dashed border-stone-200">
              <MessageSquare size={30} className="text-stone-300 mb-3" />
              <p className="text-[12px] font-bold uppercase tracking-wider text-stone-500">
                {reviewFilter === 'all' ? 'No feedback recorded yet' : `No entries matching ${reviewFilter}-Stars`}
              </p>
              {reviewFilter === 'all' && (
                <p className="text-[11px] text-stone-400 italic mt-1">Be the foundational review for this style piece</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProductTabs;