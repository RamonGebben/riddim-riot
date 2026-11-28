import { hzToX } from '~/game/sound/curves';
import { GUTTER, INSET, type ScreenSize } from '../../../Screen';

/** Decibels the spectrum screens span, bottom to top. */
export const DB_RANGE: [number, number] = [-36, 24];

const LINES = [
  { hz: 100, label: '100' },
  { hz: 1000, label: '1k' },
  { hz: 10_000, label: '10k' },
];

/** Pixels across for `hz` on a spectrum screen. */
export const spectrumX = ({ width }: ScreenSize, hz: number) =>
  INSET + hzToX(hz) * (width - INSET * 2);

/** Pixels down for `db` on a spectrum screen, above its axis gutter. */
export const spectrumY = ({ height }: ScreenSize, db: number) => {
  const [low, high] = DB_RANGE;
  const share = (Math.min(Math.max(db, low), high) - low) / (high - low);
  const bottom = height - GUTTER;
  return bottom - share * (bottom - INSET);
};

/** The frequency at pixel `x` across a spectrum screen. */
export const spectrumHz = ({ width }: ScreenSize, x: number) => {
  const share = (x - INSET) / (width - INSET * 2);
  return 20 * 1000 ** Math.min(Math.max(share, 0), 1);
};

/** The decibels at pixel `y` down a spectrum screen. */
export const spectrumDb = ({ height }: ScreenSize, y: number) => {
  const [low, high] = DB_RANGE;
  const bottom = height - GUTTER;
  const share = (bottom - y) / (bottom - INSET);
  return low + Math.min(Math.max(share, 0), 1) * (high - low);
};

/**
 * The frequency grid and the 0 dB line under a spectrum curve, labelled in
 * the gutter beneath the plot so no trace runs through a label.
 */
export const SpectrumGrid = ({ size }: { size: ScreenSize }) => {
  const zero = spectrumY(size, 0);
  const bottom = size.height - GUTTER;
  return (
    <g>
      {LINES.map(({ hz, label }) => {
        const x = spectrumX(size, hz);
        return (
          <g key={hz}>
            <line className="grid" x1={x} x2={x} y1={0} y2={bottom} />
            <text
              className="axis"
              x={x}
              y={size.height - 3}
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      })}
      <line className="grid" x1={0} x2={size.width} y1={zero} y2={zero} />
    </g>
  );
};
