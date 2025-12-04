import { Helmet } from 'react-helmet-async';

interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
  };
  sameAs?: string[];
}

interface ProductSchema {
  name: string;
  description: string;
  image: string[];
  sku: string;
  brand?: string;
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  reviewCount?: number;
  url: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

// Organization schema for the business
export const OrganizationStructuredData = ({ 
  organization 
}: { 
  organization: OrganizationSchema 
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organization.name,
    url: organization.url,
    logo: organization.logo,
    ...(organization.contactPoint && {
      contactPoint: {
        "@type": "ContactPoint",
        telephone: organization.contactPoint.telephone,
        contactType: organization.contactPoint.contactType,
      }
    }),
    ...(organization.sameAs && { sameAs: organization.sameAs }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Product schema for product pages
export const ProductStructuredData = ({ product }: { product: ProductSchema }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    ...(product.brand && {
      brand: {
        "@type": "Brand",
        name: product.brand,
      }
    }),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.priceCurrency || "KES",
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      url: product.url,
    },
    ...(product.rating && product.reviewCount && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      }
    }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Breadcrumb schema
export const BreadcrumbStructuredData = ({ items }: { items: BreadcrumbItem[] }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// WebSite schema for search functionality
export const WebsiteStructuredData = ({ 
  name, 
  url, 
  searchUrl 
}: { 
  name: string; 
  url: string;
  searchUrl: string;
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Local Business schema
export const LocalBusinessStructuredData = ({
  name,
  url,
  logo,
  telephone,
  email,
  address,
  openingHours,
}: {
  name: string;
  url: string;
  logo: string;
  telephone?: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    region: string;
    country: string;
  };
  openingHours?: string[];
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url,
    logo,
    ...(telephone && { telephone }),
    ...(email && { email }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: address.street,
        addressLocality: address.city,
        addressRegion: address.region,
        addressCountry: address.country,
      }
    }),
    ...(openingHours && { openingHours }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
