import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';

interface Product {
  name: string;
  description?: string;
  categories?: string;
  features?: string[] | string;
  price: number;
  image_urls?: string[];
  stock?: number;
  rating?: number;
  reviews?: number;
}

interface ProductMetadataProps {
  product: Product;
  currentPrice: number;
}

/**
 * Gem Fashion Style - Theme Palette Context
 * Primary: Deep Emerald Rose (#0F4C43)
 * Secondary: Soft Champagne (#F7EBE1)
 * Accent: Vivid Amber Gold (#D4AF37)
 */

const ProductMetadata: React.FC<ProductMetadataProps> = ({ product, currentPrice }) => {
  const { title, description, image } = useMemo(() => {
    const t = `${product.name.split('(')[0].trim()} - ${product.categories || 'Fashion Collection'} | Gem Fashion Style`;
    const d = `${product.description || product.name} - Starting from KES ${product.price}. ${
      product.features
        ? 'Styles: ' + (Array.isArray(product.features) ? product.features.join(', ') : product.features)
        : ''
    }`;
    const img = product.image_urls?.[0] || '/placeholder.svg';
    return { title: t, description: d, image: img };
  }, [product]);

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image_urls || [],
      brand: { '@type': 'Brand', name: 'Gem Fashion Style' },
      offers: {
        '@type': 'Offer',
        price: currentPrice,
        priceCurrency: 'KES',
        availability:
          product.stock && product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'Gem Fashion Style' },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'KE',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 7,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/FreeReturn',
        },
      },
      aggregateRating: product.rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews || 0,
          }
        : undefined,
    }),
    [product, currentPrice]
  );

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph Meta Tags (Styled for Social Media Cards) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="product" />
      <meta property="og:url" content={currentUrl} />
      
      {/* Twitter Cards Theme Meta */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Mobile Browser Custom Color Styling for Gem Fashion Brand */}
      <meta name="theme-color" content="#0F4C43" />
      <meta name="msapplication-navbutton-color" content="#0F4C43" />
      <meta name="apple-mobile-web-app-status-bar-style" content="#0F4C43" />
      
      <link rel="canonical" href={currentUrl} />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
};

export default ProductMetadata;