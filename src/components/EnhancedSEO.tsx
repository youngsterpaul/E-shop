import { Helmet } from 'react-helmet-async';
import { 
  generateOrganizationSchema, 
  generateWebsiteSchema,
  generateLocalBusinessSchema 
} from '@/utils/schemaMarkup';

/**
 * Enhanced SEO Component
 * Adds global structured data and meta tags for better SEO
 * Should be included in the main App component
 */
export function EnhancedSEO() {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();
  const localBusinessSchema = generateLocalBusinessSchema();

  // Combine all schemas into a single JSON-LD array
  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationSchema,
      websiteSchema,
      localBusinessSchema
    ]
  };

  return (
    <Helmet>
      {/* Enhanced Global Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      
      {/* Mobile Web App Capable */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Geographic Tags */}
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Nairobi" />
      <meta name="geo.position" content="-1.286389;36.817223" />
      <meta name="ICBM" content="-1.286389, 36.817223" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(combinedSchema)}
      </script>
      
      {/* Alternate for language/region */}
      <link rel="alternate" hrefLang="en-ke" href="https://www.smartkenya.co.ke" />
      <link rel="alternate" hrefLang="x-default" href="https://www.smartkenya.co.ke" />
    </Helmet>
  );
}
