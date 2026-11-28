import { useEffect, useRef } from 'react';
import styled from 'styled-components';

/** The meter's span: 2 dB a segment from -48 dB up to 0. */
const FLOOR_DB = -48;
const SEGMENT_DB = 2;
const SEGMENTS = -FLOOR_DB / SEGMENT_DB;
/** Loud from here (the last 6 dB), clipping in the last segment. */
const HOT_DB = -6;
const SCALE = [-48, -24, -12, -6, 0];
/** How long the peak segment holds before it falls. */
const PEAK_HOLD_MS = 1200;

const Frame = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0 ${({ theme }) => theme.spacing('xxs')};
`;

const Name = styled.span`
  grid-row: span 2;
  color: ${({ theme }) => theme.color('tertiary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.16em;
`;

const Segments = styled.div`
  display: grid;
  grid-template-columns: repeat(${SEGMENTS}, 1fr);
  gap: 2px;
  block-size: 0.625rem;

  & > span {
    border-radius: 1px;
    background: ${({ theme }) => theme.color('background')};
  }
  & > span[data-on='true'] {
    background: ${({ theme }) => theme.color('primary')};
  }
  & > span[data-hot][data-on='true'] {
    background: ${({ theme }) => theme.color('primary', 'emphasis')};
  }
  & > span[data-clip][data-on='true'] {
    background: ${({ theme }) => theme.color('error')};
  }
`;

const Scale = styled.div`
  position: relative;
  block-size: 1em;
  color: ${({ theme }) => theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-variant-numeric: tabular-nums;
  line-height: 1;

  & > span {
    position: absolute;
    translate: -50% 0;
  }
  & > span:first-child {
    translate: 0 0;
  }
  & > span:last-child {
    translate: -100% 0;
  }
`;

const lit = (db: number) =>
  Number.isFinite(db)
    ? Math.max(0, Math.min(SEGMENTS, Math.ceil((db - FLOOR_DB) / SEGMENT_DB)))
    : 0;

/**
 * Output level as a row of segments with a dB scale and a held peak,
 * redrawn every animation frame straight onto the segments - a meter that
 * re-rendered React 60 times a second would be the slow part.
 */
export const Meter = ({ read }: { read: () => number }) => {
  const segments = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let peak = { count: 0, at: 0 };
    const draw = (now: number) => {
      const db = read();
      const count = lit(db);
      if (count >= peak.count || now - peak.at > PEAK_HOLD_MS) {
        peak = { count, at: now };
      }
      [...(segments.current?.children ?? [])].forEach((segment, i) => {
        segment.setAttribute(
          'data-on',
          String(i < count || i === peak.count - 1),
        );
      });
      meter.current?.setAttribute(
        'aria-valuenow',
        String(Number.isFinite(db) ? Math.round(db) : FLOOR_DB),
      );
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [read]);

  return (
    <Frame
      ref={meter}
      role="meter"
      aria-label="Output level"
      aria-valuemin={FLOOR_DB}
      aria-valuemax={0}
      aria-valuenow={FLOOR_DB}
    >
      <Name aria-hidden="true">OUT</Name>
      <Segments ref={segments}>
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const top = FLOOR_DB + (i + 1) * SEGMENT_DB;
          return (
            <span
              key={top}
              data-hot={top > HOT_DB ? '' : undefined}
              data-clip={i === SEGMENTS - 1 ? '' : undefined}
            />
          );
        })}
      </Segments>
      <Scale aria-hidden="true">
        {SCALE.map(db => (
          <span
            key={db}
            style={{
              insetInlineStart: `${((db - FLOOR_DB) / -FLOOR_DB) * 100}%`,
            }}
          >
            {db}
          </span>
        ))}
      </Scale>
    </Frame>
  );
};
