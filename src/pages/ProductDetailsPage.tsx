
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Search, Settings, ShoppingBag, Star } from 'lucide-react';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Button } from "@/components/ui/button"
import { Link } from 'react-router-dom';
import MobileBottomActions from '@/components/product/MobileBottomActions';

const ProductDetailsPage = () => {
  const { productName, id } = useParams();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
    const gridCols = isMobile 
    ? "grid-cols-1" 
    : "grid-cols-2";

  const { data: product, isLoading: loading, error } = useProduct(id || '');
  const { variants } = useProductVariants(id || '');
  
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  // Generate SEO-friendly slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Redirect to correct URL if product name doesn't match
  useEffect(() => {
    if (product && productName && id) {
      const correctSlug = generateSlug(product.name);
      
      if (productName !== correctSlug) {
        navigate(`/products/${product.categories || 'general'}/${correctSlug}/${id}`, { replace: true });
      }
    }
  }, [product, productName, id, navigate]);

  // Transform variants for VariantSelector
  const transformedVariants = variants.reduce((acc, variant) => {
    const existingType = acc.find(v => v.id === variant.variant_type);
    
    if (existingType) {
      existingType.values.push({
        id: variant.variant_value,
        name: variant.variant_value,
        value: variant.variant_value,
        available: variant.stock_quantity > 0,
        priceModifier: variant.price_modifier
      });
    } else {
      acc.push({
        id: variant.variant_type,
        name: variant.variant_type.charAt(0).toUpperCase() + variant.variant_type.slice(1),
        type: variant.variant_type === 'color' ? 'color' : variant.variant_type === 'size' ? 'size' : 'other',
        values: [{
          id: variant.variant_value,
          name: variant.variant_value,
          value: variant.variant_value,
          available: variant.stock_quantity > 0,
          priceModifier: variant.price_modifier
        }]
      });
    }
    
    return acc;
  }, [] as any[]);

  const requiredVariants = transformedVariants.map(v => v.id);

  const handleVariantChange = (variantTypeId: string, variantValueId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantTypeId]: variantValueId
    }));
  };

  const calculatePrice = () => {
    if (!product) return 0;
    let totalModifier = 0;
    
    Object.entries(selectedVariants).forEach(([type, value]) => {
      const variant = variants.find(v => v.variant_type === type && v.variant_value === value);
      if (variant) {
        totalModifier += variant.price_modifier;
      }
    });
    
    return product.price + totalModifier;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  // SEO Meta Data
  const generateMetaData = () => {
    if (!product) return {};
    
    const title = `${product.name} - ${product.categories || 'Products'} | Smartkenya Online Shopping`;
    const description = `${product.description || product.name} - Starting from KES ${product.price}. ${product.features ? 'Features: ' + (Array.isArray(product.features) ? product.features.join(', ') : product.features) : ''}`;
    const image = product.image_urls?.[0] || '/placeholder.svg';
    
    return { title, description, image };
  };

  const { title, description, image } = generateMetaData();

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {!isMobile && <Header />}
        {isMobile && <MobileHeader 
          title="Product Details"
          backTo="/products"
          rightAction={
            <Link to="/search">
              <Button variant="ghost" size="sm" className="p-2">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
          }
        />
      }
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-6 w-64" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Product Image Skeleton */}
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full max-w-[500px] mx-auto rounded-lg" />
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="w-16 h-16 rounded-lg" />
                ))}
              </div>
            </div>
            
            {/* Product Info Skeleton */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              
              <div className="space-y-4">
                <Skeleton className="h-6 w-20" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-16" />
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-12 w-32" />
              </div>
              
              <div className="flex gap-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-12 w-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[400px]">
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
      </div>
    );
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: product.categories || 'Products', href: `/category/${product.categories || 'all'}` },
    { label: product.name.split('(')[0].trim(), }
  ];

  // Transform product for components
  const productWithImages = {
    id: product.product_id,
    name: product.name.split('(')[0].trim(),
    image: product.image_urls?.[0] || '/placeholder.svg',
    images: product.image_urls || [],
    video: (product as any).video,
  };

  // Transform product for ProductTabs with proper features handling
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

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image_urls || [],
    "brand": {
      "@type": "Brand",
      "name": "Smartkenya Online Shopping"
    },
    "offers": {
      "@type": "Offer",
      "price": calculatePrice(),
      "priceCurrency": "KES",
      "availability": product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Smartkenya Online Shopping"
      }
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": (product as any).reviews || 0
    } : undefined
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
        {!isMobile && <Header />}
        {isMobile && (<MobileHeader
          title={"Product Details"}
          rightAction={
          <Link to="/search">
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="h-4 w-4" />
            </Button>
          </Link>
          }
        />)}
        <main className={`container mx-auto py-6 ${isMobile ? 'pb-20 px-1' : 'pb-8'}`}>
          {/* Breadcrumb */}
          {!isMobile && (
            <SiteBreadcrumb items={breadcrumbItems} className="mb-6" />
          )}

          {/* Product Layout */}
          <div className={`grid ${gridCols} p-4 max-w-7xl`}>
            {/* Enhanced Image Gallery */}
            <div className=''>
              <EnhancedProductImageGallery product={productWithImages} />
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Product Title and Rating */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  {(product.name.split('(')[0].trim())}
                </h1>
                
                {product.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(product.rating!) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({(product as any).reviews || 0} reviews)</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-orange-500">
                    {formatPrice(calculatePrice())}
                  </span>
                  {calculatePrice() !== product.price && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Price includes VAT</p>
              </div>

              {/* Product Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Variant Selector */}
              {!isMobile && transformedVariants.length > 0 && (
                <VariantSelector
                  variants={transformedVariants}
                  selectedVariants={selectedVariants}
                  onVariantChange={handleVariantChange}
                />
              )}

              {/* Add to Cart Section - Desktop only */}
              {!isMobile && (
                <AddToCartSection
                  product={{
                    product_id: product.product_id,
                    name: product.name.split('(')[0].trim(),
                    price: calculatePrice(),
                    stock: product.stock
                  }}
                  selectedVariants={selectedVariants}
                  requiredVariants={requiredVariants}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                />
              )}

              {/* Additional Info */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>✓ Free shipping on orders over KES 5,000</p>
                <p>✓ 30-day return policy</p>
                <p>✓ Secure payment options</p>
              </div>
            </div>
          </div>
          
          {/* Tabbed Content */}
          <ProductTabs product={productForTabs} />
          
          {/* Related Products */}
          <RelatedProductsCarousel 
            currentProduct={{ 
              id: product.product_id, 
              category: product.categories || 'general' 
            }} 
          />
        </main>

        {/* Mobile Bottom Actions */}
        {isMobile && (
          <MobileBottomActions
            product={{
              product_id: product.product_id,
              name: product.name.split('(')[0].trim(),
              price: product.price,
              originalPrice: undefined,
              description: product.description,
              rating: product.rating || 0,
              reviews: (product as any).reviews || 0,
              inStock: product.stock ? product.stock > 0 : true,
              category: product.categories || 'general',
              subcategory: undefined,
              attributes: typeof product.specification === 'string' && product.specification
                ? JSON.parse(product.specification)
                : product.specification || {},
              features: typeof product.features === 'string' 
                ? [product.features] 
                : Array.isArray(product.features) 
                  ? product.features 
                  : []
            }}
            selectedVariants={selectedVariants}
            requiredVariants={requiredVariants}
            onVariantChange={handleVariantChange}
            calculatePrice={calculatePrice}
          />
        )}
      </div>
    </>
  );
};

export default ProductDetailsPage;
