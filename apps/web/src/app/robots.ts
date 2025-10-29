import { MetadataRoute } from 'next';

/**
 * Robots.txt configuration
 * SEO optimization for search engine crawlers
 *
 * Constitution Principle VII: User Experience
 * - SEO optimization required for public launch
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://speedstein.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/*',
          '/api/*',
          '/_next/*',
          '/admin/*',
        ],
      },
      {
        userAgent: 'GPTBot', // OpenAI's bot
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
