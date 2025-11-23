/**
 * Advanced Schema Markup Generator for SEO
 * Generates structured data for better search engine visibility
 */

export interface Product {
  name: string;
  description?: string;
  image_urls?: string[];
  price: number;
  categories?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
  product_id: string;
}

/**
 * Generate Product Schema (schema.org/Product)
 */
export function generateProductSchema(product: Product, currentPrice: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: product.image_urls || [],
    sku: product.product_id,
    brand: {
      '@type': 'Brand',
      name: 'SmartKenya'
    },
    offers: {
      '@type': 'Offer',
      price: currentPrice,
      priceCurrency: 'KES',
      availability: product.stock && product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'SmartKenya',
        url: 'https://www.smartkenya.co.ke'
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'KE',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
      }
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews || 0,
      bestRating: 5,
      worstRating: 1
    } : undefined
  };
}

/**
 * Generate Organization Schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SmartKenya',
    alternateName: 'SmartKenya Online Shopping',
    url: 'https://www.smartkenya.co.ke',
    logo: 'https://www.smartkenya.co.ke/smartkenya-logo.png',
    description: 'Leading online electronics and gadgets store in Kenya. Shop smartphones, laptops, accessories and more with fast delivery across Kenya.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KE',
      addressRegion: 'Nairobi'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+254-700-000000',
      contactType: 'Customer Service',
      areaServed: 'KE',
      availableLanguage: ['English', 'Swahili']
    },
    sameAs: [
      'https://twitter.com/Smartkenya_Online_Shopping',
      'https://facebook.com/smartkenya',
      'https://instagram.com/smartkenya'
    ]
  };
}

/**
 * Generate Website Schema
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SmartKenya',
    url: 'https://www.smartkenya.co.ke',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.smartkenya.co.ke/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * Generate Breadcrumb Schema
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
}

/**
 * Generate Local Business Schema
 */
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    name: 'SmartKenya',
    image: 'https://www.smartkenya.co.ke/smartkenya-logo.png',
    '@id': 'https://www.smartkenya.co.ke',
    url: 'https://www.smartkenya.co.ke',
    telephone: '+254-700-000000',
    priceRange: 'KES 500 - KES 500,000',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Nairobi CBD',
      addressLocality: 'Nairobi',
      addressRegion: 'Nairobi',
      postalCode: '00100',
      addressCountry: 'KE'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -1.286389,
      longitude: 36.817223
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday'
      ],
      opens: '08:00',
      closes: '18:00'
    },
    sameAs: [
      'https://twitter.com/Smartkenya_Online_Shopping',
      'https://facebook.com/smartkenya'
    ]
  };
}

/**
 * Generate FAQ Schema
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * Generate ItemList Schema (for product categories/collections)
 */
export function generateItemListSchema(
  items: Array<{ name: string; url: string; image?: string; price?: number }>,
  listName: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url,
      name: item.name
    }))
  };
}

/**
 * Generate Review Schema
 */
export function generateReviewSchema(review: {
  author: string;
  rating: number;
  text: string;
  date: string;
  productName: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: review.productName
    },
    author: {
      '@type': 'Person',
      name: review.author
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    reviewBody: review.text,
    datePublished: review.date
  };
}
