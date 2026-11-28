import { filterResponse } from '~/game/sound/curves';
import type { Engine } from '~/game/sound/racks';
import { formatParam } from '~/utils/formatParam';
import {
  numberAt,
  setNumber,
  WEAPON_FIELDS,
  type Tuning,
} from '../../../../tuning';
import { Handle } from '../../../Handle';
import { pathOf, Screen } from '../../../Screen';
import {
  spectrumDb,
  spectrumHz,
  spectrumX,
  spectrumY,
  SpectrumGrid,
} from '../SpectrumGrid';

/** The low-pass's gain at its cutoff: Q per stage, in dB. */
const peakDb = (q: number, stages: number) =>
  20 * Math.log10(Math.max(q, 0.01)) * stages;
const qFromDb = (db: number, stages: number) => 10 ** (db / 20 / stages);

const clampTo = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(Math.max(value, min), max);

/**
 * The engine's filter. The dashed box is where rolls can land - cutoff
 * across, resonance up - and its edges drag the design's ranges. The amber
 * handle is this weapon's roll: dragging it overrides the cutoff (across)
 * and resonance (up) for this audition only.
 */
export const FilterScreen = ({
  engine,
  tuning,
}: {
  engine: Engine;
  tuning: Tuning;
}) => {
  const { design, weapon } = tuning;
  const at = (...rest: Array<string | number>) => [
    'parts',
    'engines',
    engine,
    ...rest,
  ];
  const cut = [
    numberAt(design, at('cutoff', 0)),
    numberAt(design, at('cutoff', 1)),
  ];
  const reso = [
    numberAt(design, at('resonance', 0)),
    numberAt(design, at('resonance', 1)),
  ];
  const rolloff = numberAt(design, [engine, 'rolloff']);
  const stages = Math.max(1, Math.round(-rolloff / 12));
  const armed = weapon.sound.oscillator === engine;
  const hz = armed ? weapon.sound.cutoff : Math.sqrt(cut[0] * cut[1]);
  const q = armed ? weapon.sound.resonance : (reso[0] + reso[1]) / 2;
  const caption = `LP ${rolloff} · ${formatParam(hz, { unit: 'Hz', step: 10 })} · Q ${q.toFixed(1)}`;

  return (
    <Screen label={`${engine} filter response`} caption={caption} height={176}>
      {size => {
        const curve = filterResponse({ kind: 'lowpass', hz, q, rolloff }).map(
          point => ({
            x: spectrumX(size, point.hz),
            y: spectrumY(size, point.db),
          }),
        );
        const box = {
          left: spectrumX(size, cut[0]),
          right: spectrumX(size, cut[1]),
          top: spectrumY(size, peakDb(reso[1], stages)),
          bottom: spectrumY(size, peakDb(reso[0], stages)),
        };
        const bottom = spectrumY(size, -100);
        const floor = bottom - 6;
        const hzAt = (x: number) => spectrumHz(size, x);
        const qAt = (y: number) => qFromDb(spectrumDb(size, y), stages);
        const edge = (
          index: 0 | 1,
          kind: 'cutoff' | 'resonance',
          value: number,
        ) => {
          const other = kind === 'cutoff' ? cut[1 - index] : reso[1 - index];
          const kept =
            index === 0 ? Math.min(value, other) : Math.max(value, other);
          setNumber(tuning, at(kind, index), kept);
        };

        return (
          <>
            <SpectrumGrid size={size} />
            {/* Where rolls land: the cutoff range down to the floor, its
                resonance range boxed. */}
            <rect
              className="fill"
              x={box.left}
              y={box.top}
              width={Math.max(box.right - box.left, 2)}
              height={Math.max(bottom - box.top, 2)}
            />
            <rect
              className="band"
              x={box.left}
              y={box.top}
              width={Math.max(box.right - box.left, 2)}
              height={Math.max(box.bottom - box.top, 4)}
            />
            <line
              className="trace-dim"
              x1={box.right}
              x2={box.right + 16}
              y1={box.top}
              y2={box.top}
            />
            <line
              className="trace-dim"
              x1={box.right}
              x2={box.right + 16}
              y1={box.bottom}
              y2={box.bottom}
            />
            <path
              className="fill"
              d={`${pathOf(curve)} L ${size.width} ${bottom} L 0 ${bottom} Z`}
            />
            <path className="trace" d={pathOf(curve)} />
            {/* The design's handles sit off the band - cutoff edges on the
                floor, resonance edges to its right - so the weapon's handle
                inside it is never under them. */}
            <Handle
              x={box.left}
              y={floor}
              grip={8}
              onDrag={({ x }) => edge(0, 'cutoff', hzAt(x))}
            />
            <Handle
              x={box.right}
              y={floor}
              grip={8}
              onDrag={({ x }) => edge(1, 'cutoff', hzAt(x))}
            />
            <Handle
              x={box.right + 16}
              y={box.top}
              grip={8}
              onDrag={({ y }) => edge(1, 'resonance', qAt(y))}
            />
            <Handle
              x={box.right + 16}
              y={box.bottom}
              grip={8}
              onDrag={({ y }) => edge(0, 'resonance', qAt(y))}
            />
            {armed && (
              <Handle
                tone="weapon"
                x={spectrumX(size, hz)}
                y={spectrumY(size, peakDb(q, stages))}
                onDrag={({ x, y }) => {
                  weapon.override(
                    'cutoff',
                    Math.round(clampTo(hzAt(x), WEAPON_FIELDS.cutoff) / 10) *
                      10,
                  );
                  weapon.override(
                    'resonance',
                    Math.round(clampTo(qAt(y), WEAPON_FIELDS.resonance) * 10) /
                      10,
                  );
                }}
                onReset={() => {
                  weapon.override('cutoff', undefined);
                  weapon.override('resonance', undefined);
                }}
              />
            )}
          </>
        );
      }}
    </Screen>
  );
};
