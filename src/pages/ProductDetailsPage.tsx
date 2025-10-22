import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import EnhancedProductImageGallery from '@/components/product/EnhancedProductImageGallery';
import ProductTabs from '@/components/product/ProductTabs';
import RelatedProductsCarousel from '@/components/product/RelatedProductsCarousel';
import SiteBreadcrumb from '@/components/Breadcrumb';
import VariantSelector from '@/components/product/VariantSelector';
import AddToCartSection from '@/components/product/AddToCartSection';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useProduct } from '@/hooks/useProducts';
import { useProductVariants } from '@/hooks/useProductVariants';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShoppingCart, Search, Star } from 'lucide-react';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Button } from '@/components/ui/button';
import MobileBottomActions from '@/components/product/MobileBottomActions';
import { useCart } from '@/hooks/useCart';

// ✅ Properly typed interfaces
interface VariantValue {
  name: string;
  image_url?: string;
}

interface Variant {
  id?: string; // Add this if needed
  variant_type: string;
  variant_value: string | VariantValue[];
  stock_quantity: number;
  price_modifier?: number;
  image_url?: string;
}

interface Product {
  product_id: string;
  name: string;
  description?: string;
  categories?: string;
  features?: string[] | string;
  specification?: string | Record<string, unknown>;
  price: number;
  discount_price?: number;
  image_urls?: string[];
  stock?: number;
  rating?: number;
  reviews?: number;
  video?: string;
}

const ProductDetailsPage: React.FC = () => {
  const { productName, id } = useParams<{ productName: string; id: string }>();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  const { data: product, isLoading: loading, error } = useProduct(id || '');
  const { variants } = useProductVariants(id || '');

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  // ------------------ Cart Handling ------------------
  let totalItems = 0;
  try {
    const { cartItems } = useCart();
    totalItems = cartItems?.reduce((total, item) => total + item.quantity, 0) ?? 0;
  } catch {
    totalItems = 0;
  }

  // ------------------ Slug Redirect ------------------
  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  useEffect(() => {
    if (product && productName && id) {
      const correctSlug = generateSlug(product.name);
      if (productName !== correctSlug) {
        navigate(`/products/${product.categories || 'general'}/${correctSlug}/${id}`, { replace: true });
      }
    }
  }, [product, productName, id, navigate]);

  const transformedVariants = useMemo(() => {
    if (!variants?.length) return [];

    return variants.reduce((acc: any[], v: Variant) => {
      const type = v.variant_type;
      const variantType: 'image' | 'size' | 'material' | 'other' =
        Array.isArray(v.variant_value) && v.variant_value.some((vv: any) => vv.image_url)
          ? 'image'
          : type.toLowerCase().includes('size')
          ? 'size'
          : type.toLowerCase().includes('material')
          ? 'material'
          : 'other';

      let values: VariantValue[] = [];
      try {
        if (typeof v.variant_value === 'string') {
          const parsed = JSON.parse(v.variant_value);
          if (Array.isArray(parsed)) values = parsed;
        } else if (Array.isArray(v.variant_value)) {
          values = v.variant_value;
        }
      } catch {
        values = [{ name: String(v.variant_value || ''), image_url: v.image_url || '' }];
      }

      values.forEach((val) => {
        const valueObj = {
          id: val.name || String(val),
          name: val.name || String(val),
          value: val.image_url ? val.image_url : val.name || String(val), // ✅ always a string
          available: v.stock_quantity > 0,
          priceModifier: v.price_modifier || 0,
          image: val.image_url || '', // ✅ key for image swatch
        };

        const existing = acc.find((x) => x.id === v.variant_type);
        if (existing) {
          existing.values.push(valueObj);
        } else {
          acc.push({
            id: v.variant_type,
            name: v.variant_type.charAt(0).toUpperCase() + v.variant_type.slice(1),
            type: variantType === 'image' ? 'color' : variantType, // 🔹 "color" triggers image swatch mode
            values: [valueObj],
          });
        }
      });

      return acc;
    }, []);
  }, [variants]);

  useEffect(() => {
    if (!transformedVariants?.length) return;

    setSelectedVariants((prev) => {
      const updated = { ...prev };

      transformedVariants.forEach((variant) => {
        const alreadySelected = updated[variant.id];
        if (!alreadySelected && variant.values.length > 0) {
          const firstAvailable = variant.values.find(v => v.available);
          if (firstAvailable) {
            updated[variant.id] = firstAvailable.id;
          }
        }
      });

      return updated;
    });
  }, [transformedVariants]);

const stockInfo = useMemo(() => {
  return variants.reduce((acc: Record<string, number>, v: Variant) => {
    let values: VariantValue[] = [];
    
    // Parse variant_value properly
    try {
      if (typeof v.variant_value === 'string') {
        const parsed = JSON.parse(v.variant_value);
        values = Array.isArray(parsed) ? parsed : [parsed];
      } else if (Array.isArray(v.variant_value)) {
        values = v.variant_value;
      }
    } catch {
      values = [{ name: String(v.variant_value || ''), image_url: '' }];
    }

    // Create stock entry for each variant value
    values.forEach((val) => {
      const valueName = val.name || String(val);
      acc[`${v.variant_type}-${valueName}`] = v.stock_quantity;
    });

    return acc;
  }, {});
}, [variants]);

  const requiredVariants = useMemo(() => transformedVariants.map((v: any) => v.id), [transformedVariants]);

  const handleVariantChange = (variantTypeId: string, variantValueId: string) =>
    setSelectedVariants((prev) => ({ ...prev, [variantTypeId]: variantValueId }));

  // ------------------ Price Calculation ------------------
  const price = useMemo(() => {
    if (!product) return 0;
    let total = product.discount_price ?? product.price ?? 0;

    for (const [type, selectedValue] of Object.entries(selectedVariants)) {
      const variant = variants.find((v) => {
        if (v.variant_type !== type) return false;
        
        let values: VariantValue[] = [];
        try {
          if (typeof v.variant_value === 'string') {
            const parsed = JSON.parse(v.variant_value);
            values = Array.isArray(parsed) ? parsed : [parsed];
          } else if (Array.isArray(v.variant_value)) {
            values = v.variant_value;
          }
        } catch {
          values = [{ name: String(v.variant_value || ''), image_url: '' }];
        }
        
        return values.some(val => val.name === selectedValue);
      });
      
      if (variant?.price_modifier) total += variant.price_modifier;
    }
    return total;
  }, [product, selectedVariants, variants]);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(p);

  // ------------------ SEO ------------------
  const { title, description, image } = useMemo(() => {
    if (!product) return { title: '', description: '', image: '' };
    const t = `${product.name.split('(')[0].trim()} - ${product.categories || 'Products'} | Smartkenya Online Shopping`;
    const d = `${product.description || product.name} - Starting from KES ${product.price}. ${
      product.features
        ? 'Features: ' + (Array.isArray(product.features) ? product.features.join(', ') : product.features)
        : ''
    }`;
    const img = product.image_urls?.[0] || '/placeholder.svg';
    return { title: t, description: d, image: img };
  }, [product]);

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product?.name,
      description: product?.description,
      image: product?.image_urls || [],
      brand: { '@type': 'Brand', name: 'Smartkenya Online Shopping' },
      offers: {
        '@type': 'Offer',
        price: price,
        priceCurrency: 'KES',
        availability:
          product?.stock && product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'Smartkenya Online Shopping' },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'KE',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 7,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/FreeReturn',
        },
      },
      aggregateRating: product?.rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews || 0,
          }
        : undefined,
    }),
    [product, price]
  );

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // ------------------ LOADING ------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {!isMobile && <Header />}
        {isMobile && (
          <MobileHeader
            title="Product Details"
            backTo="/"
            rightAction={
              <div className="flex items-center gap-2">
                <Button onClick={() => navigate('/search')} variant="ghost" size="sm" className="p-2">
                  <Search className="h-4 w-4" />
                </Button>
                <Button onClick={() => navigate('/wishlist')} variant="ghost" size="sm" className="p-2">
                  <Heart className="h-4 w-4" />
                </Button>
                <Link to="/cart" aria-label="View Cart" className="relative text-gray-700 hover:text-primary transition-colors p-2">
                  <ShoppingCart size={16} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>
              </div>
            }
          />
        )}
        {/* Skeleton UI */}
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-6 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Skeleton className="aspect-square w-full max-w-[500px] mx-auto rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ ERROR ------------------
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <p className="text-gray-600 mb-4">
            {error ? 'There was an error loading the product.' : 'The product you\'re looking for doesn\'t exist.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to homepage
          </button>
        </div>
      </div>
    );
  }

  // ------------------ DATA PREP ------------------
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: product.categories || 'Products', href: `/category/${product.categories || 'all'}` },
    { label: product.name }
  ];

  const productWithImages = {
    id: product.product_id,
    name: product.name.split('(')[0].trim(),
    image: product.image_urls?.[0] || '/placeholder.svg',
    images: product.image_urls || [],
  };

  const productForTabs = {
    ...product,
    features: typeof product.features === 'string'
      ? [product.features]
      : Array.isArray(product.features)
        ? product.features
        : [],
    specification: typeof product.specification === 'string' && product.specification
      ? JSON.parse(product.specification)
      : product.specification || {}
  };

  // ------------------ RENDER ------------------
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={currentUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
        {!isMobile && <Header />}
        {isMobile && (
          <MobileHeader
            title="Product Details"
            backTo="/"
            rightAction={
              <div className="flex items-center gap-2">
                <Button onClick={() => navigate('/search')} variant="ghost" size="sm" className="p-2">
                  <Search className="h-4 w-4" />
                </Button>
                <Button onClick={() => navigate('/wishlist')} variant="ghost" size="sm" className="p-2">
                  <Heart className="h-4 w-4" />
                </Button>
                <Link to="/cart" aria-label="View Cart" className="relative text-gray-700 hover:text-primary transition-colors p-2">
                  <ShoppingCart size={16} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>
              </div>
            }
          />
        )}

        <main className={`${isMobile ? 'pb-16 px-0' : 'xl:px-24 py-6 px-4'} container mx-auto`}>
          {!isMobile && <SiteBreadcrumb items={breadcrumbItems} className="mb-6 hidden" />}

          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6 max-w-7xl mx-auto bg-white ${!isMobile ? 'p-4 px-0' : ''}`}>
            <EnhancedProductImageGallery product={productWithImages} />

            <div className={`space-y-6 ${isMobile ? 'px-2' : 'px-4'}`}>
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-3" style={{ textAlign: 'justify' }}>
                  {product.name}
                </h1>
                {product.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < Math.floor(product.rating!) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({product.reviews || 0} reviews)</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-orange-500">{formatPrice(price)}</span>
                  {price !== product.price && (
                    <span className="text-xl text-gray-500 line-through">{formatPrice(product.price)}</span>
                  )}
                </div>
              </div>

              {!isMobile && transformedVariants.length > 0 && (
                <VariantSelector
                  variants={transformedVariants}
                  selectedVariants={selectedVariants}
                  onVariantChange={handleVariantChange}
                  stockInfo={stockInfo}
                />
              )}

              {!isMobile && (
                <AddToCartSection
                  product={{
                    product_id: product.product_id,
                    name: product.name,
                    price: price,
                    stock: product.stock
                  }}
                  selectedVariants={selectedVariants}
                  requiredVariants={requiredVariants}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                />
              )}

              {isMobile && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>✓ Free shipping on orders over KES 10,000</p>
                  <p>✓ 7-days return policy</p>
                  <p>✓ Secure payment options</p>
                </div>
              )}
            </div>
          </div>

          <ProductTabs product={productForTabs} />

          <RelatedProductsCarousel
            currentProduct={{ id: product.product_id, category: product.categories || 'general' }}
          />
        </main>

        {isMobile && (
          <MobileBottomActions
            product={{
              product_id: product.product_id,
              name: product.name,
              image: product.image_urls || '/placeholde.svg',
              price: product.price,
              originalPrice: undefined,
              description: product.description,
              rating: product.rating || 0,
              reviews: product.reviews || 0,
              inStock: product.stock ? product.stock > 0 : true,
              category: product.categories || 'general',
              subcategory: undefined,
              attributes:
                typeof product.specification === 'string' && product.specification
                  ? JSON.parse(product.specification)
                  : product.specification || {},
              features:
                typeof product.features === 'string'
                  ? [product.features]
                  : Array.isArray(product.features)
                    ? product.features
                    : []
            }}
            selectedVariants={selectedVariants}
            requiredVariants={requiredVariants}
            onVariantChange={handleVariantChange}
            calculatePrice={() => price}
          />
        )}
      </div>
    </>
  );
};

export default ProductDetailsPage;
