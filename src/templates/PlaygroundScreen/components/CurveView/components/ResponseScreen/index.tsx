import type { DesignPath } from '~/game/sound/schema';
import { filterResponse, type FilterKind } from '~/game/sound/curves';
import { formatParam } from '~/utils/formatParam';
import { numberAt, setNumber, type Tuning } from '../../../../tuning';
import { Handle } from '../../../Handle';
import { pathOf, Screen } from '../../../Screen';
import {
  spectrumDb,
  spectrumHz,
  spectrumX,
  spectrumY,
  SpectrumGrid,
} from '../SpectrumGrid';

const NAMES = {
  lowpass: 'LP',
  highpass: 'HP',
  bandpass: 'BP',
} satisfies Record<FilterKind, string>;
/** A Butterworth's Q, for filters with no focus of their own. */
const FLAT_Q = 0.707;

/**
 * A fixed filter's response. The handle drags its frequency across and,
 * when it has a focus (Q) of its own, the focus up.
 */
export const ResponseScreen = ({
  filter,
  hz: hzPath,
  q: qPath,
  tuning,
}: {
  filter: FilterKind;
  hz: DesignPath;
  q?: DesignPath;
  tuning: Tuning;
}) => {
  const hz = numberAt(tuning.design, hzPath);
  const q = qPath
    ? numberAt(tuning.design, qPath)
    : filter === 'bandpass'
      ? 2
      : FLAT_Q;
  const caption = `${NAMES[filter]} ${formatParam(hz, { unit: 'Hz', step: 10 })}${qPath ? ` · Q ${q.toFixed(1)}` : ''}`;

  return (
    <Screen
      label={`${NAMES[filter]} filter response`}
      caption={caption}
      height={96}
    >
      {size => {
        const trace = filterResponse({ kind: filter, hz, q }).map(point => ({
          x: spectrumX(size, point.hz),
          y: spectrumY(size, point.db),
        }));
        const bottom = spectrumY(size, -100);
        // The low- and high-pass peak by their Q; the band-pass sits at 0.
        const peak = filter === 'bandpass' ? 0 : 20 * Math.log10(q);
        return (
          <>
            <SpectrumGrid size={size} />
            <path
              className="fill"
              d={`${pathOf(trace)} L ${size.width} ${bottom} L 0 ${bottom} Z`}
            />
            <path className="trace" d={pathOf(trace)} />
            <Handle
              x={spectrumX(size, hz)}
              y={spectrumY(size, qPath ? peak : 0)}
              onDrag={({ x, y }) => {
                setNumber(tuning, hzPath, spectrumHz(size, x));
                if (qPath && filter !== 'bandpass') {
                  setNumber(tuning, qPath, 10 ** (spectrumDb(size, y) / 20));
                }
              }}
            />
          </>
        );
      }}
    </Screen>
  );
};
