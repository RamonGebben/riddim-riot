import { hzToX, sweepPoints, xToHz } from '~/game/sound/curves';
import type { Engine } from '~/game/sound/racks';
import type { LfoPart } from '~/game/weapons';
import { formatParam } from '~/utils/formatParam';
import { numberAt, setNumber, type Tuning } from '../../../../tuning';
import { Handle } from '../../../Handle';
import { INSET, pathOf, Screen, type ScreenSize } from '../../../Screen';

/** LFO cycles in the half bar drawn, per rate. */
const CYCLES = { '1/2': 1, '1/4': 2, '1/8': 4, '1/16': 8 } satisfies Record<
  LfoPart,
  number
>;

const hzY = ({ height }: ScreenSize, hz: number) =>
  height - INSET - hzToX(hz) * (height - INSET * 2);
const yHz = ({ height }: ScreenSize, y: number) =>
  xToHz(Math.min(Math.max((height - INSET - y) / (height - INSET * 2), 0), 1));

/** Where the engine's LFO sweeps its filter between, and from what phase. */
const sweepOf = (engine: Engine, tuning: Tuning, cutoff: number) => {
  const { design } = tuning;
  if (engine === 'laser') {
    return {
      min: cutoff * numberAt(design, ['laser', 'shimmerDepth']),
      max: cutoff,
      phase: 0,
    };
  }
  const floor = numberAt(design, [engine, 'sweepFloor']);
  return {
    min: engine === 'beam' ? Math.min(floor, cutoff) : floor,
    max: cutoff,
    phase: engine === 'wobble' ? numberAt(design, ['wobble', 'phase']) : 0,
  };
};

/**
 * The LFO sweeping the filter over half a bar, from where each shot opens. The
 * amber line is the weapon's cutoff, the top of the sweep; the blue handle
 * drags its floor.
 */
export const SweepScreen = ({
  engine,
  tuning,
}: {
  engine: Engine;
  tuning: Tuning;
}) => {
  const { weapon, design } = tuning;
  const armed = weapon.sound.oscillator === engine;
  const range = [
    numberAt(design, ['parts', 'engines', engine, 'cutoff', 0]),
    numberAt(design, ['parts', 'engines', engine, 'cutoff', 1]),
  ];
  const cutoff = armed ? weapon.sound.cutoff : Math.sqrt(range[0] * range[1]);
  const lfo = weapon.sound.lfo;
  const { min, max, phase } = sweepOf(engine, tuning, cutoff);
  const caption = `${lfo} · ${formatParam(min, { unit: 'Hz', step: 10 })} → ${formatParam(max, { unit: 'Hz', step: 10 })}`;

  return (
    <Screen label={`${engine} LFO sweep`} caption={caption}>
      {size => {
        const x = (cycle: number) =>
          INSET + (cycle / CYCLES[lfo]) * (size.width - INSET * 2);
        const points = sweepPoints(
          { min, max, phase, cycles: CYCLES[lfo] },
          240,
        );
        const trace = points.map(point => ({
          x: x(point.cycle),
          y: hzY(size, point.hz),
        }));
        const lowest = points.reduce((low, point) =>
          point.hz < low.hz ? point : low,
        );
        const beats = [1].map(
          beat => INSET + (beat / 2) * (size.width - INSET * 2),
        );
        const top = hzY(size, max);

        return (
          <>
            {beats.map(beatX => (
              <line
                key={beatX}
                className="grid"
                x1={beatX}
                x2={beatX}
                y1={0}
                y2={size.height}
              />
            ))}
            <line
              className="weapon-line"
              x1={0}
              x2={size.width}
              y1={top}
              y2={top}
            />
            <path className="trace" d={pathOf(trace)} />
            <Handle
              x={x(lowest.cycle)}
              y={hzY(size, min)}
              onDrag={({ y }) => {
                const hz = yHz(size, y);
                if (engine === 'laser') {
                  setNumber(tuning, ['laser', 'shimmerDepth'], hz / cutoff);
                } else setNumber(tuning, [engine, 'sweepFloor'], hz);
              }}
            />
          </>
        );
      }}
    </Screen>
  );
};
