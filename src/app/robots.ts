import type { MetadataRoute } from 'next';
import { siteUrl } from '~/utils/siteUrl';

const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: '*', allow: '/' },
  sitemap: `${siteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)}/sitemap.xml`,
});

export default robots;
