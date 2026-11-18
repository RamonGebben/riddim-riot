import styled from 'styled-components';

/** The live combo multiplier, loud enough to notice mid-fight. */
export const Combo = styled.strong`
  color: ${({ theme }) => theme.color('quaternary')};
  font-size: ${({ theme }) => theme.fontSize('m')};
`;
