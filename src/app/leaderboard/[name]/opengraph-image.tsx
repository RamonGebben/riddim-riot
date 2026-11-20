import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { darkMode } from '~/theme';
import { ordinal } from '~/utils/ordinal';
import { findPlace } from './place';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt =
  "A player's place on the Bass Weapons high scores: their rank, name and all-time points.";

const { colorPalette: color } = darkMode;
const number = (value: number) => value.toLocaleString('en');

/** The song track's shape: two drops brighter, the way the HUD draws it. */
const TRACK = [
  { bars: 16, drop: false },
  { bars: 8, drop: false },
  { bars: 8, drop: false },
  { bars: 16, drop: true },
  { bars: 16, drop: true },
  { bars: 16, drop: false },
  { bars: 40, drop: true },
  { bars: 16, drop: false },
];

interface CardProps {
  params: Promise<{ name: string }>;
}

/** The card a shared place unfurls into: rank, name, points. */
const PlaceCard = async ({ params }: CardProps) => {
  const [place, font] = await Promise.all([
    findPlace((await params).name),
    readFile(join(process.cwd(), 'assets/fonts/JetBrainsMono-Bold.ttf')),
  ]);
  const rank = place?.rank ? ordinal(place.rank) : 'NEW';
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '64px 72px',
        background: color.background.base,
        color: color.background.text,
        fontFamily: 'JetBrains Mono',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: color.tertiary.base,
          fontSize: 28,
          letterSpacing: '0.2em',
        }}
      >
        <span>BASS WEAPONS</span>
        <span>HIGH SCORES</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span
          style={{
            color: color.primary.base,
            fontSize: 196,
            lineHeight: 1,
            textShadow: `0 0 36px ${color.primary.base}`,
          }}
        >
          {rank}
        </span>
        <span style={{ fontSize: 88, lineHeight: 1.1 }}>
          {place?.name ?? 'BASS WEAPONS'}
        </span>
        <span style={{ color: color.secondary.base, fontSize: 36 }}>
          {place
            ? `${number(place.totalPoints)} POINTS · ${number(place.runsCount)} RUNS`
            : 'EVERY GUN IS A BASS SYNTH'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, height: 14 }}>
        {TRACK.map(({ bars, drop }, index) => (
          <div
            key={index}
            style={{
              flexGrow: bars,
              borderRadius: 3,
              background: drop ? color.tertiary.base : color.primary.base,
              opacity: index < 6 ? 1 : 0.3,
            }}
          />
        ))}
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'JetBrains Mono', data: font, weight: 700 }],
    },
  );
};

export default PlaceCard;
