import styled, { type DefaultTheme } from 'styled-components';
import { SIDE_BY_SIDE } from '../../layout';

const floor =
  (percent: number) =>
  ({ theme }: { theme: DefaultTheme }) =>
    `color-mix(in srgb, ${theme.color('background')} ${percent}%, transparent)`;

/**
 * Darkens the level only behind the text: a pool under the hero and a band
 * under the briefing, leaving the rest of the level to show through.
 */
export const Shade = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(
      ellipse 70% 45% at 50% 32%,
      ${floor(72)} 0%,
      ${floor(40)} 60%,
      transparent 100%
    ),
    linear-gradient(to bottom, transparent 55%, ${floor(80)});
  pointer-events: none;

  @media ${SIDE_BY_SIDE} {
    background:
      linear-gradient(
        to right,
        ${floor(85)} 0%,
        ${floor(65)} min(40rem, 50%),
        transparent min(56rem, 75%)
      ),
      linear-gradient(to bottom, transparent 60%, ${floor(80)});
  }
`;
