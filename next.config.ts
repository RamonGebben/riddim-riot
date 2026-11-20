import type { NextConfig } from 'next';

const config: NextConfig = {
  compiler: { styledComponents: true },
  turbopack: {
    // Shaders are imported as source text (`./rave.frag?raw`, which Vite
    // reads the same way for tests and Storybook).
    rules: { '*.frag': { type: 'raw' } },
  },
};

export default config;
