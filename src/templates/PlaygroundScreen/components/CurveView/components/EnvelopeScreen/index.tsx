import { valueAt, type DesignPath } from '~/game/sound/schema';
import { envelopePoints } from '~/game/sound/curves';
import { formatParam } from '~/utils/formatParam';
import { numberAt, setNumber, type Tuning } from '../../../../tuning';
import { Handle } from '../../../Handle';
import {
  GUTTER,
  INSET,
  pathOf,
  Screen,
  type ScreenSize,
} from '../../../Screen';

/** Seconds across the screen; time is drawn on a square-root scale. */
const SPAN = 2.5;
/** How long the note is held, for drawing. */
const HOLD = 0.25;
/** A lead has no attack of its own: it plucks. */
const PLUCK = 0.005;

const timeX = ({ width }: ScreenSize, seconds: number) =>
  INSET + Math.sqrt(Math.min(seconds, SPAN) / SPAN) * (width - INSET * 2);
const xTime = ({ width }: ScreenSize, x: number) =>
  SPAN * Math.min(Math.max((x - INSET) / (width - INSET * 2), 0), 1) ** 2;
/** Level up the plot, which stops above the axis gutter. */
const levelY = ({ height }: ScreenSize, level: number) =>
  height - GUTTER - level * (height - GUTTER - INSET);
const yLevel = ({ height }: ScreenSize, y: number) =>
  Math.min(Math.max((height - GUTTER - y) / (height - GUTTER - INSET), 0), 1);

/**
 * An amp envelope held for a quarter second, time on a square-root scale so
 * a 5 ms attack is as easy to see and drag as a 1 s release. Handles: the
 * attack's peak, the decay into the sustain, the end of the release.
 */
export const EnvelopeScreen = ({
  root,
  tuning,
}: {
  root: DesignPath;
  tuning: Tuning;
}) => {
  const { design } = tuning;
  const hasAttack = valueAt(design, [...root, 'attack']) !== undefined;
  const envelope = {
    attack: hasAttack ? numberAt(design, [...root, 'attack']) : PLUCK,
    decay: numberAt(design, [...root, 'decay']),
    sustain: numberAt(design, [...root, 'sustain']),
    release: numberAt(design, [...root, 'release']),
  };
  const time = (seconds: number) =>
    formatParam(seconds, { unit: 's', step: 0.001 });
  const caption = `${time(envelope.attack)} · ${time(envelope.decay)} · ${Math.round(envelope.sustain * 100)}% · ${time(envelope.release)}`;

  return (
    <Screen label="Amp envelope" caption={caption}>
      {size => {
        const trace = envelopePoints(envelope, HOLD).map(point => ({
          x: timeX(size, point.x),
          y: levelY(size, point.y),
        }));
        const decayEnd = envelope.attack + envelope.decay;
        const releaseAt = Math.max(HOLD, decayEnd);
        const floor = levelY(size, 0);
        return (
          <>
            {[0.01, 0.1, 0.5, 1, 2]
              // Only marks far enough apart to read on a narrow screen.
              .filter(
                (seconds, i, marks) =>
                  i === 0 ||
                  timeX(size, seconds) - timeX(size, marks[i - 1]) >= 40,
              )
              .map(seconds => (
                <g key={seconds}>
                  <line
                    className="grid"
                    x1={timeX(size, seconds)}
                    x2={timeX(size, seconds)}
                    y1={0}
                    y2={size.height - GUTTER}
                  />
                  <text
                    className="axis"
                    x={timeX(size, seconds)}
                    y={size.height - 3}
                    textAnchor="middle"
                  >
                    {seconds < 1 ? `${seconds * 1000}ms` : `${seconds}s`}
                  </text>
                </g>
              ))}
            <path
              className="fill"
              d={`${pathOf(trace)} L ${trace.at(-1)?.x ?? 0} ${floor} Z`}
            />
            <path className="trace" d={pathOf(trace)} />
            {hasAttack && (
              <Handle
                x={timeX(size, envelope.attack)}
                y={levelY(size, 1)}
                onDrag={({ x }) =>
                  setNumber(tuning, [...root, 'attack'], xTime(size, x))
                }
              />
            )}
            <Handle
              x={timeX(size, decayEnd)}
              y={levelY(size, envelope.sustain)}
              onDrag={({ x, y }) => {
                setNumber(
                  tuning,
                  [...root, 'decay'],
                  xTime(size, x) - envelope.attack,
                );
                setNumber(tuning, [...root, 'sustain'], yLevel(size, y));
              }}
            />
            <Handle
              x={timeX(size, releaseAt + envelope.release)}
              y={floor}
              onDrag={({ x }) =>
                setNumber(
                  tuning,
                  [...root, 'release'],
                  xTime(size, x) - releaseAt,
                )
              }
            />
          </>
        );
      }}
    </Screen>
  );
};
