import type { DesignPath } from '~/game/sound/schema';
import { decayPoints } from '~/game/sound/curves';
import { formatParam } from '~/utils/formatParam';
import { fieldAt, numberAt, setNumber, type Tuning } from '../../../../tuning';
import { Handle } from '../../../Handle';
import { INSET, pathOf, Screen } from '../../../Screen';

/**
 * A one-shot dying away over its decay, drawn across the decay's whole
 * range so its length reads against how long it could be. The handle drags
 * the decay.
 */
export const DecayScreen = ({
  decay: path,
  tuning,
}: {
  decay: DesignPath;
  tuning: Tuning;
}) => {
  const decay = numberAt(tuning.design, path);
  const field = fieldAt(path);
  const span = field.kind === 'number' ? field.max : Math.max(decay, 1);

  return (
    <Screen
      label="Decay"
      caption={formatParam(decay, { unit: 's', step: 0.001 })}
      height={64}
    >
      {size => {
        // A square-root scale: short decays get room, and it holds still
        // while the handle drags.
        const x = (time: number) =>
          INSET + Math.sqrt(time / span) * (size.width - INSET * 2);
        const y = (level: number) =>
          size.height - INSET - level * (size.height - INSET * 2);
        const trace = decayPoints(decay).map(point => ({
          x: x(point.x),
          y: y(point.y),
        }));
        return (
          <>
            <path
              className="fill"
              d={`${pathOf(trace)} L ${x(decay)} ${y(0)} L ${x(0)} ${y(0)} Z`}
            />
            <path className="trace" d={pathOf(trace)} />
            <Handle
              x={x(decay)}
              y={y(Math.exp(-3))}
              onDrag={({ x: px }) =>
                setNumber(
                  tuning,
                  path,
                  span *
                    Math.min(
                      Math.max((px - INSET) / (size.width - INSET * 2), 0),
                      1,
                    ) **
                      2,
                )
              }
            />
          </>
        );
      }}
    </Screen>
  );
};
