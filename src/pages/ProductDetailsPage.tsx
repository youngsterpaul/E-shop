import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EnhancedProductImageGallery from '@/components/product/EnhancedProductImageGallery';
import ProductTabs from '@/components/product/ProductTabs';
import RelatedProductsCarousel from '@/components/product/RelatedProductsCarousel';
import SiteBreadcrumb from '@/components/Breadcrumb';
import VariantSelector from '@/components/product/VariantSelector';
import AddToCartSection from '@/components/product/AddToCartSection';
import ProductInfo from '@/components/product/ProductInfo';
import PriceDisplay from '@/components/product/PriceDisplay';
import ProductMetadata from '@/components/product/ProductMetadata';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useProduct } from '@/hooks/useProducts';
import { useProductVariants } from '@/hooks/useProductVariants';
import { Skeleton } from '@/components/ui/skeleton';
import MobileBottomActions from '@/components/product/MobileBottomActions';
import { useShippingSettings } from '@/hooks/useShippingSettings';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';

// ✅ Properly typed interfaces
interface ProductVariant {
  id: string;
  variant_type: string;
  variant_value: string;
  price_modifier: number;
  stock_quantity: number;
  image_url?: string | null;
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
  
  // ✅ ALL HOOKS MUST BE CALLED IN THE SAME ORDER EVERY RENDER
  const isMobile = isMobileUserAgent();
  const { data: product, isLoading: loading, error } = useProduct(id || '');
  const { variants } = useProductVariants(id || '');
  const { shippingFee, freeShippingThreshold } = useShippingSettings();
  const { calculations, setShippingSettings } = useSelectiveCart();

  // ✅ STATE HOOKS (always called in same order)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  // ✅ Update context when shipping settings load
  useEffect(() => {
    if (shippingFee !== undefined && freeShippingThreshold !== undefined) {
      setShippingSettings(shippingFee, freeShippingThreshold);
    }
  }, [shippingFee, freeShippingThreshold, setShippingSettings]);

  const amountNeededForFreeDelivery = (freeShippingThreshold || 0) - calculations.subtotal;

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

  // ✅ ALL MEMOS (always called in same order)
  const transformedVariants = useMemo(() => {
    if (!variants?.length) return [];

    return variants.reduce((acc: any[], v: ProductVariant) => {
      const type = v.variant_type;
      const valueString = String(v.variant_value || '');

      const variantType: 'image' | 'size' | 'material' | 'other' =
        v.image_url
          ? 'image'
          : type.toLowerCase().includes('size')
          ? 'size'
          : type.toLowerCase().includes('material')
          ? 'material'
          : 'other';

      const existing = acc.find((x) => x.id === v.variant_type);
      
      if (existing) {
        existing.values.push({
          id: valueString,
          name: valueString,
          value: v.image_url || valueString,
          available: v.stock_quantity > 0,
          priceModifier: v.price_modifier || 0,
          image: v.image_url || undefined,
          stockQuantity: v.stock_quantity
        });
      } else {
        acc.push({
          id: v.variant_type,
          name: v.variant_type.charAt(0).toUpperCase() + v.variant_type.slice(1),
          type: variantType === 'image' ? 'color' : variantType,
          values: [{
            id: valueString,
            name: valueString,
            value: v.image_url || valueString,
            available: v.stock_quantity > 0,
            priceModifier: v.price_modifier || 0,
            image: v.image_url || undefined,
            stockQuantity: v.stock_quantity
          }]
        });
      }

      return acc;
    }, []);
  }, [variants]);

  const selectedColorImageUrl = useMemo(() => {
    const colorGroup = transformedVariants.find((v: any) => v.type === 'color');
    if (!colorGroup) return undefined;
    const selectedId = selectedVariants[colorGroup.id];
    const val = colorGroup.values.find((vv: any) => vv.id === selectedId);
    if (val?.image) return val.image as string;

    const name = (val?.name || '').toLowerCase();
    if (name && product?.image_urls?.length) {
      const match = product.image_urls.find((u: string) => u.toLowerCase().includes(name));
      return match;
    }
    return undefined;
  }, [transformedVariants, selectedVariants, product]);

  const stockInfo = useMemo(() => {
    if (!variants?.length) return {};
    
    const stockMap: Record<string, number> = {};
    
    variants.forEach((v: ProductVariant) => {
      const valueName = String(v.variant_value);
      stockMap[`${v.variant_type}-${valueName}`] = v.stock_quantity;
    });

    return stockMap;
  }, [variants]);

  const requiredVariants = useMemo(() => transformedVariants.map((v: any) => v.id), [transformedVariants]);

  const price = useMemo(() => {
    if (!product) return 0;
    let total = product.discount_price ?? product.price ?? 0;

    for (const [type, selectedValue] of Object.entries(selectedVariants)) {
      const variant = variants.find((v) => {
        return v.variant_type === type && String(v.variant_value) === selectedValue;
      });
      
      if (variant) {
        total += variant.price_modifier || 0;
      }
    }

    return total;
  }, [product, selectedVariants, variants]);

  const variantImages = useMemo(() => {
    const colorGroup = transformedVariants.find((v: any) => v.type === 'color');
    if (!colorGroup) return [];
    
    return colorGroup.values
      .filter((v: any) => v.image)
      .map((v: any) => ({
        url: v.image as string,
        label: v.name || v.id
      }));
  }, [transformedVariants]);

const productForTabs = useMemo(() => {
  if (!product?.product_id || !product.name) return null;

  return {
    product_id: product.product_id,
    name: product.name,
    features: typeof product.features === 'string'
      ? [product.features]
      : Array.isArray(product.features)
        ? product.features
        : [],
    specification: typeof product.specification === 'string' && product.specification
      ? JSON.parse(product.specification)
      : product.specification || {},
    attributes: product.attributes
  };
}, [product]);


  // ✅ EFFECTS (after all hooks and memos)
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

  // ✅ EVENT HANDLERS
  const handleVariantChange = (variantTypeId: string, variantValueId: string) =>
    setSelectedVariants((prev) => ({ ...prev, [variantTypeId]: variantValueId }));

  const calculatePrice = () => price;

  // ------------------ LOADING ------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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

  // ------------------ RENDER ------------------
  return (
    <>
      <ProductMetadata product={product} currentPrice={price} />

      <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
        <main className={`${isMobile ? 'pb-16 px-0' : 'xl:px-24 py-6 px-4'} container mx-auto`}>
          {!isMobile && <SiteBreadcrumb items={breadcrumbItems} className="mb-6 hidden" />}

          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6 max-w-7xl mx-auto bg-white ${!isMobile ? 'p-4 px-0' : ''}`}>
            <EnhancedProductImageGallery 
              product={productWithImages} 
              selectedImageUrl={selectedColorImageUrl}
              variantImages={variantImages}
            />

            <div className={`space-y-4 ${isMobile ? 'px-2' : 'px-4'}`}>
              <ProductInfo 
                name={product.name}
                rating={product.rating}
                reviews={product.reviews}
              />

              <PriceDisplay 
                currentPrice={price}
                originalPrice={product.price}
              />

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
                  <p>✓ Free shipping on orders over KES {Math.max(0, amountNeededForFreeDelivery).toLocaleString()}</p>
                  <p>✓ 7-days return policy</p>
                  <p>✓ Secure payment options</p>
                </div>
              )}
            </div>
          </div>

          {productForTabs && <ProductTabs product={productForTabs} />}

          <RelatedProductsCarousel
            currentProduct={{ id: product.product_id, category: product.categories || 'general' }}
          />
        </main>

        {isMobile && (
          <MobileBottomActions
            product={{
              product_id: product.product_id,
              name: product.name,
              image: product.image_urls?.[0] || '/placeholder.svg',
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
            calculatePrice={calculatePrice}
          />
        )}
      </div>
    </>
  );
};

export default ProductDetailsPage;