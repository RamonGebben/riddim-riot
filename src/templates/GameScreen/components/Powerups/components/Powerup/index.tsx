import styled, { keyframes } from 'styled-components';

const arrive = keyframes`
  from { transform: scale(1.6); }
  to { transform: scale(1); }
`;

/** One running powerup: its icon and seconds left, in its own colour. */
export const Powerup = styled.li<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xxs')};
  color: ${({ $color }) => $color};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  font-variant-numeric: tabular-nums;
  filter: drop-shadow(0 0 4px currentColor);
  animation: ${arrive} 0.25s ease-out;

  :root[data-flashing='reduced'] & {
    animation: none;
  }
`;
