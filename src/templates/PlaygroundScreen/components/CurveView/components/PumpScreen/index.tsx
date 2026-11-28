import { pumpPoints } from '~/game/sound/curves';
import { numberAt, setNumber, type Tuning } from '../../../../tuning';
import { Handle } from '../../../Handle';
import { INSET, pathOf, Screen, type ScreenSize } from '../../../Screen';

/** The playground's beat, at 140 BPM; the screen shows two kicks. */
const BEAT = 60 / 140;
const BEATS = 2;
/** Gain marks on the side, in dB. */
const MARKS = [-6, -12, -24];

/** Gain is drawn as the bus ramps it: linear, full at the top. */
const gainY = ({ height }: ScreenSize, db: number) =>
  INSET + (1 - 10 ** (db / 20)) * (height - INSET * 2);
const yDb = ({ height }: ScreenSize, y: number) => {
  const gain = 1 - (y - INSET) / (height - INSET * 2);
  return 20 * Math.log10(Math.min(Math.max(gain, 0.01), 1));
};

/**
 * The kick's duck over two beats: the weapons (solid) and the bed (dashed)
 * pulled down on each kick and swelling back, drawn in gain as the bus
 * ramps it. Handles drag the weapons' depth and the swell's length.
 */
export const PumpScreen = ({ tuning }: { tuning: Tuning }) => {
  const { design } = tuning;
  const weaponDb = numberAt(design, ['mix', 'weaponPumpDb']);
  const bedDb = numberAt(design, ['mix', 'bedPumpDb']);
  const seconds = numberAt(design, ['mix', 'pumpSeconds']);

  return (
    <Screen
      label="Sidechain pump"
      caption={`weapons ${weaponDb}dB · bed ${bedDb}dB · ${Math.round(seconds * 1000)}ms`}
    >
      {size => {
        const x = (time: number) =>
          INSET + (time / (BEAT * BEATS)) * (size.width - INSET * 2);
        const trace = (db: number) =>
          Array.from({ length: BEATS }, (_, beat) =>
            pumpPoints(db, seconds, BEAT, 48).map(point => ({
              x: x(beat * BEAT + point.x),
              y: gainY(size, point.y),
            })),
          ).flat();
        return (
          <>
            {MARKS.map(db => (
              <g key={db}>
                <line
                  className="grid"
                  x1={0}
                  x2={size.width}
                  y1={gainY(size, db)}
                  y2={gainY(size, db)}
                />
                <text
                  className="axis"
                  x={size.width - INSET}
                  y={gainY(size, db) - 3}
                  textAnchor="end"
                >
                  {db}
                </text>
              </g>
            ))}
            <line
              className="grid"
              x1={x(BEAT)}
              x2={x(BEAT)}
              y1={0}
              y2={size.height}
            />
            <path className="trace-dim" d={pathOf(trace(bedDb))} />
            <path className="trace" d={pathOf(trace(weaponDb))} />
            <Handle
              x={x(0)}
              y={gainY(size, weaponDb)}
              onDrag={({ y }) =>
                setNumber(tuning, ['mix', 'weaponPumpDb'], yDb(size, y))
              }
            />
            <Handle
              x={x(Math.min(seconds, BEAT))}
              y={gainY(size, 0)}
              onDrag={({ x: px }) =>
                setNumber(
                  tuning,
                  ['mix', 'pumpSeconds'],
                  ((px - INSET) / (size.width - INSET * 2)) * BEAT * BEATS,
                )
              }
            />
          </>
        );
      }}
    </Screen>
  );
};
