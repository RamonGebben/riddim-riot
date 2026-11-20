'use client';

import dynamic from 'next/dynamic';

/**
 * The game reads the window, audio and WebGL from its first render, so it
 * never renders on the server.
 */
export const ClientApp = dynamic(
  () => import('../App').then(module => module.App),
  { ssr: false },
);
