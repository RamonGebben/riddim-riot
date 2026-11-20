'use client';

import dynamic from 'next/dynamic';

/** Like the game, the playground runs audio from its first render. */
export const ClientPlayground = dynamic(
  () => import('~/playground').then(module => module.Playground),
  { ssr: false },
);
