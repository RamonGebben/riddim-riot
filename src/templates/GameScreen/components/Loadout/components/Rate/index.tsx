import styled from 'styled-components';

/** The weapon's beat: how often it fires. */
export const Rate = styled.span`
  grid-area: rate;
  font-size: ${({ theme }) => theme.fontSize('base')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
`;
