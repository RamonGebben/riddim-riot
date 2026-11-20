const DOMAIN = 'bass-weapons.ra-ge.net';

/**
 * The canonical origin for share cards and crawlers. Vercel sets
 * `VERCEL_PROJECT_PRODUCTION_URL` to the shortest production domain, so the
 * custom domain becomes canonical once it's attached and vercel.app until
 * then.
 */
export const siteUrl = (productionUrl: string | undefined): string =>
  `https://${productionUrl || DOMAIN}`;
