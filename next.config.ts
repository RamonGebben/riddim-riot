import type { NextConfig } from 'next';

const config: NextConfig = {
  compiler: { styledComponents: true },
  turbopack: {
    // Shaders are imported as source text (`./rave.frag?raw`, which Vite
    // reads the same way for tests and Storybook).
    rules: { '*.frag': { type: 'raw' } },
  },
  // The game was Bass Weapons, then lived at riddim-riot.ra-ge.net: the
  // old domains still carry shared seed and leaderboard links, so every
  // path lands on the same page here.
  redirects: async () =>
    ['bass-weapons.ra-ge.net', 'riddim-riot.ra-ge.net'].map(host => ({
      source: '/:path*',
      has: [{ type: 'host' as const, value: host }],
      destination: 'https://riddimriot.com/:path*',
      permanent: true,
    })),
};

export default config;
