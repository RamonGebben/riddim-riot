import type { DesignPath } from '~/game/sound/schema';
import { dropPoints } from '~/game/sound/curves';
import { formatParam } from '~/utils/formatParam';
import { fieldAt, numberAt, setNumber, type Tuning } from '../../../../tuning';
import { Handle } from '../../../Handle';
import { INSET, pathOf, Screen, type ScreenSize } from '../../../Screen';

/** The biggest multiple a drop can start from (the schema's max). */
const TOP = 16;

const multipleY = ({ height }: ScreenSize, multiple: number) =>
  height - INSET - (Math.log(multiple) / Math.log(TOP)) * (height - INSET * 2);
const yMultiple = ({ height }: ScreenSize, y: number) =>
  TOP ** Math.min(Math.max((height - INSET - y) / (height - INSET * 2), 0), 1);

/**
 * A pitch falling onto its note: the start handle drags how far above it
 * starts, the knee how long it takes. Pitch on an octave scale, over twice
 * the drop's time (at least 100 ms).
 */
export const DropScreen = ({
  multiple: multiplePath,
  seconds: secondsPath,
  tuning,
}: {
  multiple: DesignPath;
  seconds: DesignPath;
  tuning: Tuning;
}) => {
  const multiple = numberAt(tuning.design, multiplePath);
  const seconds = numberAt(tuning.design, secondsPath);
  // The drop time's whole range, fixed, so the knee doesn't run away from
  // the pointer as it drags.
  const field = fieldAt(secondsPath);
  const span = field.kind === 'number' ? field.max : Math.max(seconds * 2, 0.1);
  const caption = `${multiple.toFixed(1)}× · ${formatParam(seconds, { unit: 's', step: 0.001 })}`;

  return (
    <Screen label="Pitch drop" caption={caption}>
      {size => {
        const x = (time: number) =>
          INSET + Math.sqrt(time / span) * (size.width - INSET * 2);
        const trace = dropPoints(multiple, seconds, span, 96).map(point => ({
          x: x(point.x),
          y: multipleY(size, point.y),
        }));
        const octaves = [2, 4, 8].filter(value => value <= TOP);
        return (
          <>
            {octaves.map(value => (
              <g key={value}>
                <line
                  className="grid"
                  x1={0}
                  x2={size.width}
                  y1={multipleY(size, value)}
                  y2={multipleY(size, value)}
                />
                <text
                  className="axis"
                  x={size.width - INSET - 18}
                  y={multipleY(size, value) - 3}
                >
                  {value}×
                </text>
              </g>
            ))}
            <path className="trace" d={pathOf(trace)} />
            <Handle
              x={x(0)}
              y={multipleY(size, multiple)}
              onDrag={({ y }) =>
                setNumber(tuning, multiplePath, yMultiple(size, y))
              }
            />
            <Handle
              x={x(seconds)}
              y={multipleY(size, 1)}
              onDrag={({ x: px }) =>
                setNumber(
                  tuning,
                  secondsPath,
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
