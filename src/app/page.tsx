import { siteUrl } from '~/utils/siteUrl';
import { ClientApp } from './_components/ClientApp';

const SITE_URL = siteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);

const GAME = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Riddim Riot',
  url: `${SITE_URL}/`,
  image: `${SITE_URL}/og.png`,
  description:
    'A twin-stick rhythm shooter where every gun is a dubstep bass synth and every shot is quantized to the beat, so your fighting writes the track.',
  genre: ['Rhythm', 'Shooter', 'Twin-stick shooter'],
  gamePlatform: 'Web browser',
  applicationCategory: 'Game',
  operatingSystem: 'Any',
  playMode: 'SinglePlayer',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
};

const GamePage = () => {
  return (
    <>
      <script
        type="application/ld+json"
        // Static data of our own, escaped so no string can close the tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(GAME).replaceAll('<', '\\u003c'),
        }}
      />
      <ClientApp />
    </>
  );
};

export default GamePage;
