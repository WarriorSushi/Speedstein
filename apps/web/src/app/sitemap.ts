import { MetadataRoute } from 'next';

/**
 * Sitemap configuration
 * SEO optimization - helps search engines discover all pages
 *
 * Constitution Principle VII: User Experience
 * - SEO optimization required for public launch
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://speedstein.com';

  // Static pages
  const routes = [
    '',
    '/pricing',
    '/docs',
    '/docs/quickstart',
    '/docs/authentication',
    '/docs/api/generate-pdf',
    '/docs/api/batch-generate',
    '/docs/api/webhooks',
    '/docs/api/errors',
    '/docs/examples/javascript',
    '/docs/examples/python',
    '/docs/examples/php',
    '/docs/examples/ruby',
    '/docs/examples/curl',
    '/docs/examples/puppeteer-migration',
    '/docs/guides/html-to-pdf',
    '/docs/guides/styling',
    '/docs/guides/page-breaks',
    '/docs/guides/headers-footers',
    '/docs/guides/custom-fonts',
    '/docs/guides/performance',
    '/docs/guides/troubleshooting',
    '/docs/pricing-tiers',
    '/docs/rate-limits',
    '/docs/changelog',
  ].map((route): MetadataRoute.Sitemap[number] => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/docs/changelog' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : route.startsWith('/docs') ? 0.7 : 0.8,
  }));

  return routes;
}
