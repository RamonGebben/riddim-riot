import type { NextConfig } from 'next';

const config: NextConfig = {
  compiler: { styledComponents: true },
  turbopack: {
    // Shaders are imported as source text (`./rave.frag?raw`, which Vite
    // reads the same way for tests and Storybook).
    rules: { '*.frag': { type: 'raw' } },
  },
  // The game was Bass Weapons: its old domain still carries shared seed
  // and leaderboard links, so every path lands on the same page here.
  redirects: async () => [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'bass-weapons.ra-ge.net' }],
      destination: 'https://riddim-riot.ra-ge.net/:path*',
      permanent: true,
    },
  ],
};

export default config;
