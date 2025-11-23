/**
 * Dynamic Sitemap Generator
 * Generates sitemap XML based on current products and pages
 * 
 * Note: For production, you should implement this as a server-side
 * endpoint or build-time generation script
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Generate sitemap URLs for all static pages
 */
export function getStaticPageUrls(baseUrl: string): SitemapUrl[] {
  const currentDate = new Date().toISOString().split('T')[0];

  return [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: 1.0, lastmod: currentDate },
    { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.7, lastmod: currentDate },
    { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: 0.7, lastmod: currentDate },
    { loc: `${baseUrl}/search`, changefreq: 'daily', priority: 0.8, lastmod: currentDate },
    { loc: `${baseUrl}/wishlist`, changefreq: 'weekly', priority: 0.5 },
    { loc: `${baseUrl}/cart`, changefreq: 'always', priority: 0.5 },
    { loc: `${baseUrl}/faq`, changefreq: 'monthly', priority: 0.6, lastmod: currentDate },
    { loc: `${baseUrl}/careers`, changefreq: 'weekly', priority: 0.6, lastmod: currentDate },
    { loc: `${baseUrl}/returns`, changefreq: 'monthly', priority: 0.6, lastmod: currentDate },
    { loc: `${baseUrl}/privacy`, changefreq: 'yearly', priority: 0.4, lastmod: currentDate },
    { loc: `${baseUrl}/terms`, changefreq: 'yearly', priority: 0.4, lastmod: currentDate },
  ];
}

/**
 * Generate sitemap URLs for products
 * This should be called with actual product data from your database
 */
export function getProductUrls(baseUrl: string, products: Array<{ product_id: string; updated_at?: string }>): SitemapUrl[] {
  return products.map(product => ({
    loc: `${baseUrl}/product/${product.product_id}`,
    changefreq: 'weekly' as const,
    priority: 0.9,
    lastmod: product.updated_at ? new Date(product.updated_at).toISOString().split('T')[0] : undefined
  }));
}

/**
 * Generate sitemap URLs for categories
 */
export function getCategoryUrls(baseUrl: string, categories: Array<{ slug: string }>): SitemapUrl[] {
  return categories.map(category => ({
    loc: `${baseUrl}/category/${category.slug}`,
    changefreq: 'weekly' as const,
    priority: 0.8
  }));
}

/**
 * Full sitemap generation
 * Usage in a server endpoint or build script:
 * 
 * const products = await fetchProductsFromDB();
 * const categories = await fetchCategoriesFromDB();
 * const sitemap = await generateFullSitemap(products, categories);
 * 
 * Then serve this at /sitemap.xml
 */
export async function generateFullSitemap(
  products: Array<{ product_id: string; updated_at?: string }>,
  categories: Array<{ slug: string }>
): Promise<string> {
  const baseUrl = 'https://www.smartkenya.co.ke';
  
  const allUrls = [
    ...getStaticPageUrls(baseUrl),
    ...getProductUrls(baseUrl, products),
    ...getCategoryUrls(baseUrl, categories)
  ];

  return generateSitemapXML(allUrls);
}
