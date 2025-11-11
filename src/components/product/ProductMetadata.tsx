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

const ProductMetadata: React.FC<ProductMetadataProps> = ({ product, currentPrice }) => {
  const { title, description, image } = useMemo(() => {
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
      name: product.name,
      description: product.description,
      image: product.image_urls || [],
      brand: { '@type': 'Brand', name: 'Smartkenya Online Shopping' },
      offers: {
        '@type': 'Offer',
        price: currentPrice,
        priceCurrency: 'KES',
        availability:
          product.stock && product.stock > 0
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
  );
};

export default ProductMetadata;
