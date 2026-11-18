import { useEffect, useRef } from 'react';
import { meterPercent } from '~/utils/meterPercent';
import { Fill } from './components/Fill';
import { Track } from './components/Track';

/**
 * Output level, redrawn every animation frame straight onto the bar - a
 * meter that re-rendered React 60 times a second would be the slow part.
 */
export const Meter = ({ read }: { read: () => number }) => {
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      if (fill.current)
        fill.current.style.inlineSize = `${meterPercent(read())}%`;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [read]);

  return (
    <Track
      role="meter"
      aria-label="Output level"
      aria-valuemin={-60}
      aria-valuemax={0}
    >
      <Fill ref={fill} />
    </Track>
  );
};
