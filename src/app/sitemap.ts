import type { MetadataRoute } from 'next';
import { siteUrl } from '~/utils/siteUrl';

const SITE_URL = siteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);

const sitemap = (): MetadataRoute.Sitemap => [
  { url: `${SITE_URL}/` },
  { url: `${SITE_URL}/leaderboard` },
];

export default sitemap;
