import type { Metadata } from 'next';
import { ClientPlayground } from '../_components/ClientPlayground';

export const metadata: Metadata = {
  title: 'Sound Playground',
  robots: { index: false },
  alternates: { canonical: null },
  openGraph: null,
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2307060f'/%3E%3Cpath d='M6 22l5-12 5 8 5-10 5 14' stroke='%2335f0ff' stroke-width='3' fill='none'/%3E%3C/svg%3E",
  },
};

const PlaygroundPage = () => {
  return <ClientPlayground />;
};

export default PlaygroundPage;
