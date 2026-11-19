import styled, { keyframes } from 'styled-components';

const bump = keyframes`
  from { transform: scale(1.5); }
  to { transform: scale(1); }
`;

/** The live combo multiplier, loud enough to notice mid-fight. */
export const Combo = styled.strong`
  display: inline-block;
  color: ${({ theme }) => theme.color('quaternary')};
  font-size: ${({ theme }) => theme.fontSize('m')};
  text-shadow: 0 0 8px currentColor;
  animation: ${bump} 0.2s ease-out;
`;
