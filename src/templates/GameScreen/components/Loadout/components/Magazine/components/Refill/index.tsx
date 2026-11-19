import styled, { keyframes } from 'styled-components';

const sweep = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

/** Sweeps over the empty cells as the magazine comes back. */
export const Refill = styled.span<{ $seconds: number; $paused: boolean }>`
  position: absolute;
  inset: 0;
  border-radius: 1px;
  background: ${({ theme }) => theme.color('quaternary')};
  opacity: 0.85;
  transform-origin: left;
  animation: ${sweep} ${({ $seconds }) => $seconds}s linear forwards;
  animation-play-state: ${({ $paused }) => ($paused ? 'paused' : 'running')};
`;
