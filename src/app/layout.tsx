import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { COLOR_MODE_META } from '@pindakaasman/design-system';
import { Analytics } from '@vercel/analytics/next';
import { StyledComponentsRegistry } from '~/providers/StyledComponentsRegistry';
import { ThemeProvider } from '~/providers/ThemeProvider';
import { TrpcProvider } from '~/providers/TrpcProvider';
import { siteUrl } from '~/utils/siteUrl';

const SITE_URL = siteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Bass Weapons - a rhythm shooter where every gun is a bass synth',
  description:
    'A free twin-stick rhythm shooter in your browser. Every gun is a dubstep bass synth and every shot lands on the beat, so your build writes the song.',
  alternates: { canonical: '/' },
  icons: {
    icon: { url: '/favicon.svg', type: 'image/svg+xml' },
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Bass Weapons',
    url: '/',
    title: 'Bass Weapons',
    description:
      'Every gun is a bass synth and every shot lands on the beat. Your build is the song. Free in your browser, desktop or phone.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'The Bass Weapons title glowing beside a dark arena, the player firing at enemies around the circle: every gun is a bass synth and every shot lands on the beat.',
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#111111',
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <head>
        {/* The game is dark by design: force the theme's dark mode with the
            design system's own override tag, whatever the OS prefers. */}
        <meta name={COLOR_MODE_META} content="dark" />
      </head>
      <body>
        <StyledComponentsRegistry>
          <TrpcProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </TrpcProvider>
        </StyledComponentsRegistry>
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
