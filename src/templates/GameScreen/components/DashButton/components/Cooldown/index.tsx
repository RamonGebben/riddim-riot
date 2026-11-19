import styled, { keyframes } from 'styled-components';

const refill = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`;

/** Rises from the bottom as the dash comes back. */
export const Cooldown = styled.span<{ $seconds: number; $paused: boolean }>`
  position: absolute !important;
  inset: 0;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('quaternary')} 30%,
    transparent
  );
  transform-origin: bottom;
  animation: ${refill} ${({ $seconds }) => $seconds}s linear forwards;
  animation-play-state: ${({ $paused }) => ($paused ? 'paused' : 'running')};
`;
