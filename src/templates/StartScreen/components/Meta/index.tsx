import styled from 'styled-components';

export const Meta = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
