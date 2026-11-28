import { filterResponse } from '~/game/sound/curves';
import { formatParam } from '~/utils/formatParam';
import { numberAt, setNumber, type Tuning } from '../../../../tuning';
import { Handle } from '../../../Handle';
import { pathOf, Screen } from '../../../Screen';
import {
  spectrumHz,
  spectrumX,
  spectrumY,
  SpectrumGrid,
} from '../SpectrumGrid';

/**
 * The growl's band-pass at both ends of its sweep: from its floor (solid,
 * dragged by its handle) up to its peak, a multiple of the weapon's cutoff
 * (dashed; its handle drags the multiple).
 */
export const GrowlScreen = ({
  engine,
  tuning,
}: {
  engine: 'wobble' | 'laser';
  tuning: Tuning;
}) => {
  const { design, weapon } = tuning;
  const at = (...rest: Array<string>) => [engine, 'layers', 'growl', ...rest];
  const floor = numberAt(design, at('floorHz'));
  const q = numberAt(design, at('q'));
  const peakShare = numberAt(design, at('peak'));
  const range = [
    numberAt(design, ['parts', 'engines', engine, 'cutoff', 0]),
    numberAt(design, ['parts', 'engines', engine, 'cutoff', 1]),
  ];
  const cutoff =
    weapon.sound.oscillator === engine
      ? weapon.sound.cutoff
      : Math.sqrt(range[0] * range[1]);
  const peak = Math.max(cutoff * peakShare, floor);
  const caption = `${formatParam(floor, { unit: 'Hz', step: 10 })} → ${formatParam(peak, { unit: 'Hz', step: 10 })} · Q ${q.toFixed(1)}`;

  return (
    <Screen label={`${engine} growl band`} caption={caption}>
      {size => {
        const curve = (hz: number) =>
          filterResponse({ kind: 'bandpass', hz, q }).map(point => ({
            x: spectrumX(size, point.hz),
            y: spectrumY(size, point.db),
          }));
        const left = spectrumX(size, floor);
        const right = spectrumX(size, peak);
        const zero = spectrumY(size, 0);
        return (
          <>
            <SpectrumGrid size={size} />
            <rect
              className="band"
              x={left}
              y={zero}
              width={Math.max(right - left, 1)}
              height={size.height - zero}
            />
            <path className="trace-dim" d={pathOf(curve(peak))} />
            <path className="trace" d={pathOf(curve(floor))} />
            <Handle
              x={left}
              y={zero}
              onDrag={({ x }) =>
                setNumber(tuning, at('floorHz'), spectrumHz(size, x))
              }
            />
            <Handle
              x={right}
              y={zero}
              onDrag={({ x }) =>
                setNumber(tuning, at('peak'), spectrumHz(size, x) / cutoff)
              }
            />
          </>
        );
      }}
    </Screen>
  );
};
