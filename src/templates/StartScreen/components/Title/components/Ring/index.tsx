import { useId } from 'react';
import styled, { keyframes } from 'styled-components';

/** A bar at 140 BPM: the ring fills a quarter on each beat. */
const BAR_SECONDS = (60 / 140) * 4;

const fill = keyframes`
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
`;

const Glyph = styled.span`
  display: inline-block;
  position: relative;
  inline-size: 0.72em;
  block-size: 0.72em;
  /* The italic I leans into an upright ring: give it room. */
  margin-inline: 0.1em 0.04em;

  svg {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    overflow: visible;
  }
`;

/**
 * The letter itself, for search and screen readers: the ring is drawn.
 * Sized to nothing, not clipped: the heading's clipped gradient paints
 * every glyph under it, whatever clips the glyph's own box.
 */
const Letter = styled.span`
  position: absolute;
  font-size: 0;
`;

const Track = styled.circle`
  stroke: ${({ theme }) => theme.color('tertiary')};
  opacity: 0.28;
`;

const Arc = styled.circle`
  transform: rotate(-90deg);
  transform-origin: center;
  stroke-dasharray: 100;
  animation: ${fill} ${BAR_SECONDS}s steps(4, jump-start) infinite;

  :root[data-flashing='reduced'] & {
    animation: none;
    stroke-dashoffset: 0;
  }
`;

const Stop = styled.stop<{ $color: 'tertiary' | 'primary' }>`
  stop-color: ${({ theme, $color }) => theme.color($color)};
`;

/** RIOT's O, drawn as the level's circle: it fills on the beat. */
export const Ring = () => {
  const gradient = useId();
  return (
    <Glyph>
      <Letter>o</Letter>
      <svg viewBox="0 0 100 100" aria-hidden>
        <defs>
          <linearGradient id={gradient}>
            <Stop offset="0" $color="tertiary" />
            <Stop offset="1" $color="primary" />
          </linearGradient>
        </defs>
        <Track cx="50" cy="50" r="39.5" fill="none" strokeWidth="21" />
        <Arc
          cx="50"
          cy="50"
          r="39.5"
          fill="none"
          stroke={`url(#${gradient})`}
          strokeWidth="21"
          pathLength={100}
        />
      </svg>
    </Glyph>
  );
};
