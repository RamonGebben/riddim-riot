import styled from 'styled-components';

/** "2/7" by the heading: how far through the walkthrough. */
export const Steps = styled.span`
  color: ${({ theme }) => theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
