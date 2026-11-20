import styled from 'styled-components';

export const Lead = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color('background', 'text')};
  font-size: ${({ theme }) => theme.fontSize('base')};
  text-wrap: balance;
`;
