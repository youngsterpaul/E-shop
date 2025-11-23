import { Helmet } from 'react-helmet-async';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  structuredData?: object;
  breadcrumbs?: Array<{ name: string; url: string }>;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
}

export const SEOHelmet = ({
  title = 'SmartKenya - Quality Electronics & Gadgets Online Shopping',
  description = 'Shop the latest electronics, gadgets, and tech accessories at SmartKenya. Fast delivery across Kenya. Best prices guaranteed.',
  keywords = 'electronics, gadgets, smartphones, laptops, accessories, Kenya, online shopping',
  canonical,
  ogImage = 'https://www.smartkenya.co.ke/apple-touch-icon.png',
  ogType = 'website',
  noindex = false,
  structuredData,
  breadcrumbs,
  article
}: SEOHelmetProps) => {
  const fullTitle = title.includes('SmartKenya') ? title : `${title} | SmartKenya`;
  const currentUrl = canonical || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="SmartKenya" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@Smartkenya_Online_Shopping" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO */}
      <meta name="author" content="SmartKenya" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      
      {/* Article specific meta tags */}
      {article && ogType === 'article' && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && (
            <meta property="article:author" content={article.author} />
          )}
          {article.section && (
            <meta property="article:section" content={article.section} />
          )}
        </>
      )}
      
      {/* Breadcrumb Schema */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((crumb, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: crumb.name,
              item: crumb.url
            }))
          })}
        </script>
      )}
      
      {/* Main Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};